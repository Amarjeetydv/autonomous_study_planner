import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import apiClient from '../../services/api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Verification token is missing. Please check your verification link.');
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
        setError(err.response?.data?.message || 'Verification token is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [searchParams]);

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
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-slate-400 text-sm mb-6">{success}</p>
            <Link
              to="/login"
              className="inline-flex w-full justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
              <XCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-red-400/80 text-sm mb-6">{error}</p>
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
