import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import apiClient from '../../services/api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Verification token is missing. Please check your verification link or request a new one below.');
      setIsLoading(false);
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyToken = async () => {
      try {
        const response = await apiClient.post('/auth/verify-email', { token });
        setSuccess(response.data.message || 'Email verified successfully! You can now log in.');
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Verification token is invalid or has expired.';
        setError(msg);
        if (msg.toLowerCase().includes('expired')) {
          setIsExpired(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setResendStatus({ type: 'error', message: 'Please provide your email address.' });
      return;
    }
    setResendLoading(true);
    setResendStatus(null);
    try {
      const response = await apiClient.post('/auth/resend-verification', { email: emailInput });
      setResendStatus({ type: 'success', message: response.data.message || 'Verification email resent! Please check your inbox.' });
    } catch (err: any) {
      setResendStatus({ type: 'error', message: err.response?.data?.message || 'Failed to resend verification email.' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 glass-panel p-8 rounded-2xl text-center shadow-xl border border-slate-800">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
            <h2 className="text-xl font-bold text-white">Verifying email...</h2>
            <p className="text-slate-400 text-sm">Please hold on while we process your request.</p>
          </div>
        ) : success ? (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Verified!</h2>
            <p className="text-slate-400 text-sm mb-6">{success}</p>
            <Link
              to="/login"
              className="inline-flex w-full justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
            >
              Sign In to Your Account
            </Link>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
              <XCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isExpired ? 'Link Expired' : 'Verification Failed'}
            </h2>
            <p className="text-red-400/80 text-sm mb-6">{error}</p>

            {resendStatus && (
              <div className={`mb-4 rounded-lg p-3 text-sm text-left ${resendStatus.type === 'success' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border border-red-500/30 text-red-400'}`}>
                {resendStatus.message}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-4 text-left border-t border-slate-800/80 pt-4 mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resend Verification Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={resendLoading}
                className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Resend Verification Link'
                )}
              </button>
            </form>

            <Link
              to="/login"
              className="inline-flex w-full justify-center rounded-xl bg-slate-900 text-slate-300 border border-slate-800 px-4 py-3 text-sm font-semibold shadow transition hover:bg-slate-800"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

