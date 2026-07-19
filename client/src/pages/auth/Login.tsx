import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { login, clearError } from '../../features/auth/authSlice';
import { RootState, AppDispatch } from '../../app/store';
import apiClient from '../../services/api/client';
import { toast } from '../../services/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  const { isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    setFormError('');
    setResendStatus(null);
  }, [dispatch]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Welcome back to Autonomous Study Planner!', '🎉 Welcome Back');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const isUnverifiedEmail = Boolean(error && (error.toLowerCase().includes('verify') || error.toLowerCase().includes('unverified')));

  useEffect(() => {
    if (isUnverifiedEmail) {
      setShowUnverifiedModal(true);
    }
  }, [isUnverifiedEmail]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendStatus(null);
    try {
      const response = await apiClient.post('/auth/resend-verification', { email });
      const msg = response.data.message || 'Verification email resent successfully! Check your inbox.';
      setResendStatus({ type: 'success', message: msg });
      toast.success('Verification email sent to ' + email, '📧 Email Sent');
      setResendCooldown(30);
    } catch (resendErr: any) {
      const msg = resendErr.response?.data?.message || 'Failed to resend verification email.';
      setResendStatus({ type: 'error', message: msg });
      toast.error(msg, 'Resend Failed');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setResendStatus(null);
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    dispatch(login({ email, password }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      {/* Unverified Email Modal */}
      {showUnverifiedModal && isUnverifiedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl text-center shadow-2xl border border-amber-500/30 relative">
            <button
              onClick={() => setShowUnverifiedModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-5">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Not Verified</h2>
            <p className="text-slate-300 text-sm mb-2">
              Please verify your email before logging in.
            </p>
            <p className="text-slate-400 text-xs mb-6">
              We already sent a verification email to <strong className="text-amber-300">{email}</strong>.
            </p>

            {resendStatus && (
              <div className={`mb-5 rounded-lg p-3 text-sm text-left ${resendStatus.type === 'success' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border border-red-500/30 text-red-400'}`}>
                {resendStatus.message}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={resendLoading || resendCooldown > 0}
                onClick={handleResendVerification}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend Email (${resendCooldown}s)`
                ) : (
                  'Resend Email'
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowUnverifiedModal(false)}
                className="w-full rounded-xl bg-slate-900 text-slate-300 border border-slate-800 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-2">StudyPilot AI</h1>
          <p className="text-slate-400 text-sm">Welcome back. Enter your credentials to access your planner.</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-xl border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(error || formError) && !isUnverifiedEmail && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-sm text-red-400">
                {formError || error}
              </div>
            )}

            {resendStatus && (
              <div className={`rounded-lg p-3 text-sm ${resendStatus.type === 'success' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border border-red-500/30 text-red-400'}`}>
                {resendStatus.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
            <span className="text-sm text-slate-400">Don't have an account? </span>
            <Link to="/register" className="text-sm font-semibold text-brand-400 hover:text-brand-300 hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
