import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useSeoMetadata } from '../hooks/useSeoMetadata';

interface AuthPagesProps {
  mode: 'login' | 'register' | 'verify-email' | 'forgot-password';
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode }) => {
  const { navigate } = useRouter();
  const {
    firebaseUser,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    resendVerificationEmail,
    requestPasswordReset,
    refreshUserState,
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const authMeta = {
    login: {
      title: 'Sign In | Deboo.pk',
      description: 'Sign in to your Deboo.pk client account for order history and saved addresses.',
    },
    register: {
      title: 'Create Account | Deboo.pk',
      description: 'Create a Deboo.pk account for tracked orders, wishlist sync, and address book.',
    },
    'verify-email': {
      title: 'Verify Email | Deboo.pk',
      description: 'Verify your email address to activate your Deboo.pk client account.',
    },
    'forgot-password': {
      title: 'Reset Password | Deboo.pk',
      description: 'Request a password reset link for your Deboo.pk client account.',
    },
  }[mode];

  useSeoMetadata({
    title: authMeta.title,
    description: authMeta.description,
    noIndex: true,
  });

  useEffect(() => {
    if (firebaseUser?.emailVerified && (mode === 'login' || mode === 'register' || mode === 'verify-email')) {
      navigate('/account');
    }
  }, [firebaseUser, mode, navigate]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGoogle(rememberMe);
      navigate('/account');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerWithEmail(fullName, email, password);
        if (res.needsVerification) {
          navigate('/verify-email');
        } else {
          navigate('/account');
        }
      } else if (mode === 'login') {
        const res = await loginWithEmail(email, password, rememberMe);
        if (!res.emailVerified) {
          navigate('/verify-email');
        } else {
          navigate('/account');
        }
      } else if (mode === 'forgot-password') {
        await requestPasswordReset(email);
        setInfoMsg('Password reset instructions have been sent to your email address.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication error.';
      if (msg.includes('operation-not-allowed')) {
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in the Firebase Console (Authentication > Sign-in method > Email/Password). You can sign in immediately with Google below.'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'verify-email') {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-[#E8DCC3] p-8 text-center space-y-5">
          <Mail className="w-10 h-10 text-[#9D7B38] mx-auto" strokeWidth={1.4} />
          <h1 className="font-serif text-3xl text-[#222222]">Verify Your Email</h1>
          <p className="text-sm text-[#777777] leading-relaxed">
            A verification link has been sent to{' '}
            <span className="font-medium text-[#222222]">{firebaseUser?.email || 'your email'}</span>.
            Please verify your email to unlock orders, saved addresses, and account access.
          </p>

          {infoMsg && <p className="text-xs text-[#9D7B38]">{infoMsg}</p>}
          {errorMsg && <p className="text-xs text-red-700">{errorMsg}</p>}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await refreshUserState();
                setLoading(false);
              }}
              className="w-full py-3 bg-[#222222] text-white text-xs uppercase tracking-[0.16em]"
            >
              I Have Verified My Email
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                try {
                  await resendVerificationEmail();
                  setInfoMsg('Verification email resent.');
                } catch (err) {
                  setErrorMsg(err instanceof Error ? err.message : 'Could not resend.');
                }
              }}
              className="w-full py-3 border border-[#E8DCC3] text-xs uppercase tracking-[0.16em]"
            >
              Resend Verification Email
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-[#E8DCC3] p-8 space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38]">Deboo.pk Client Portal</p>
          <h1 className="font-serif text-3xl text-[#222222] mt-1">
            {mode === 'register'
              ? 'Create Your Account'
              : mode === 'forgot-password'
                ? 'Reset Password'
                : 'Welcome Back'}
          </h1>
        </div>

        {mode !== 'forgot-password' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 border border-[#222222] bg-[#FAF8F3] hover:bg-[#E8DCC3]/40 text-xs uppercase tracking-[0.16em] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#9D7B38]" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#E8DCC3]" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-[0.15em] text-[#777777]">
                or via email
              </span>
              <div className="flex-grow border-t border-[#E8DCC3]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Zara Ahmed"
                className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3]"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3]"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label htmlFor="auth-pass" className="block text-xs uppercase tracking-[0.12em] text-[#777777] mb-1">
                Password
              </label>
              <input
                id="auth-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E8DCC3] px-3.5 py-2.5 text-sm bg-[#FAF8F3]"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#222222] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#222222]"
                />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[#9D7B38] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 leading-relaxed">
              {errorMsg}
            </p>
          )}
          {infoMsg && (
            <p className="text-xs text-[#9D7B38] bg-[#FAF8F3] border border-[#C8A45D] p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMsg}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A] disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'register'
                ? 'Create Account'
                : mode === 'forgot-password'
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-[#777777] pt-2 border-t border-[#E8DCC3]">
          {mode === 'register' ? (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#9D7B38] font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Deboo.pk?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-[#9D7B38] font-medium hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
