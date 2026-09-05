/**
 * Verify Email Page
 * 
 * Target for /verify-email/:token:
 * - Automatically verifies token on page mount
 * - Displays success state with CTA to login
 * - Displays actionable error state if link expired
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        if (isMounted) {
          setStatus('success');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.error?.message || 'Verification link is invalid or has expired.'
          );
        }
      }
    };

    if (token) {
      verify();
    } else {
      setStatus('error');
      setErrorMessage('Missing verification token in URL.');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full text-center p-8 shadow-card">
        {/* State 1: Verifying in progress */}
        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <RefreshCw size={36} className="text-primary-600 animate-spin mx-auto" />
            <h2 className="text-xl font-heading font-bold">Verifying your email...</h2>
            <p className="text-sm text-surface-muted">Please hold on while we validate your token.</p>
          </div>
        )}

        {/* State 2: Verification Successful */}
        {status === 'success' && (
          <div className="space-y-6 animate-slide-up">
            <div className="w-16 h-16 bg-accent-teal/10 text-accent-teal rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                Email verified!
              </h2>
              <p className="mt-2 text-sm text-surface-muted leading-relaxed">
                Your email address has been successfully verified. You now have full access to PathForge.
              </p>
            </div>
            <Link to="/login" className="btn-primary w-full py-3">
              Proceed to Sign in
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* State 3: Verification Failed */}
        {status === 'error' && (
          <div className="space-y-6 animate-slide-up">
            <div className="w-16 h-16 bg-accent-rose/10 text-accent-rose rounded-full flex items-center justify-center mx-auto">
              <XCircle size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-surface-dark dark:text-white">
                Verification failed
              </h2>
              <p className="mt-2 text-sm text-surface-muted leading-relaxed">{errorMessage}</p>
            </div>
            <div className="space-y-3 pt-2">
              <Link to="/login" className="btn-secondary w-full py-2.5">
                Go to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
