import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { registerUser, clearError } from '../../features/auth/authSlice';
import { RootState, AppDispatch } from '../../app/store';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Mentor'>('Student');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    setFormError('');
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setFormError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setFormError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setFormError('Password must contain at least one number');
      return;
    }

    const resultAction = await dispatch(registerUser({ name, email, password, confirmPassword, role }));
    if (registerUser.fulfilled.match(resultAction)) {
      setSuccessMessage(resultAction.payload || 'Registration successful. Please log in.');
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
        <div className="w-full max-w-md z-10 glass-panel p-8 rounded-2xl text-center shadow-xl border border-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created Successfully</h2>
          <p className="text-slate-300 text-sm mb-6">
            {successMessage || 'Registration successful. Please log in.'}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-flex w-full justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join StudyPilot AI to construct your adaptive study journey.</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-xl border border-slate-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {(error || formError) && (
              <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-sm text-red-400">
                {formError || error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  I am a...
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Shield className="h-5 w-5 text-slate-500" />
                  </div>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'Student' | 'Mentor')}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500 appearance-none"
                  >
                    <option value="Student">Student</option>
                    <option value="Mentor">Mentor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 invisible">
                  Help
                </label>
                <div className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                  {role === 'Student' ? 'Plan schedules, complete tasks, study topics.' : 'Review plans, provide recommendations and feedback.'}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600 focus:ring-2 focus:ring-brand-500 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-5">
            <span className="text-sm text-slate-400">Already have an account? </span>
            <Link to="/login" className="text-sm font-semibold text-brand-400 hover:text-brand-300 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
