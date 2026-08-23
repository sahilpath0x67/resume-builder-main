'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/userStore';

// ── helpers ──────────────────────────────────────────────────────────────────
function friendlyError(err: unknown): string {
  if (!(err instanceof FirebaseError)) return 'Something went wrong. Please try again.';
  switch (err.code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password must be at least 8 characters.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user': return 'Sign-in popup was closed. Please try again.';
    default: return err.message;
  }
}

const FEATURES = [
  { icon: '✦', text: 'AI-written bullet points' },
  { icon: '⚡', text: 'ATS keyword scoring' },
  { icon: '✉', text: 'Cover letter generator' },
  { icon: '🔗', text: 'LinkedIn bio writer' },
  { icon: '📄', text: 'PDF & HTML export' },
  { icon: '💾', text: 'Save unlimited CVs' },
];

const BRAND_LOGO = '/nepastra-logo.jpeg';

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotMode, setForgotMode] = useState(false);

  const router = useRouter();
  const isLoading = loading || gLoading;

  const switchTab = (t: 'signin' | 'signup') => { setTab(t); setError(''); setSuccess(''); setForgotMode(false); };

  // ── Email auth ──────────────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (forgotMode) {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Check your inbox.');
        setForgotMode(false);
        setLoading(false);
        return;
      }
      if (tab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await createUserProfile(cred.user.uid, email, name.trim());
      }
      router.push('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Google auth ─────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGLoading(true); setError('');
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await createUserProfile(cred.user.uid, cred.user.email ?? '', cred.user.displayName ?? '');
      router.push('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setGLoading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 13, borderRadius: 12,
    border: '1px solid #e5e7eb', background: '#fff', color: '#111827',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: #1D4ED8 !important; box-shadow: 0 0 0 3px rgba(29,78,216,0.15) !important; }
        * { box-sizing: border-box; }
      `}</style>

      <div className="auth-shell" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Close button — returns to main page */}
        <button
          type="button"
          className="auth-close"
          onClick={() => router.push('/')}
          aria-label="Back to app"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#6b7280',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            fontFamily: 'inherit',
            lineHeight: 1,
          }}
          title="Back to app"
        >
          ✕
        </button>
        {/* ── LEFT SIDEBAR ── */}
        <aside className="auth-sidebar" style={{ width: 320, flexShrink: 0, background: 'linear-gradient(160deg, #172554 0%, #1E3A8A 52%, #7F1D1D 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2.5rem 2rem' }}>
          <div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
              <div style={{ width: 64, height: 40, borderRadius: 10, background: '#fff', border: '1px solid rgba(255,255,255,0.42)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.22)' }}>
                <img src={BRAND_LOGO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.24)' }} />
              </div>
              <span style={{ color: '#DBEAFE', fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: '#FCA5A5' }}>Nep</span><span style={{ color: '#DBEAFE' }}>Astra</span>
              </span>
            </div>

            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 600, lineHeight: 1.4, marginBottom: 10, marginTop: 0 }}>
              Build resumes that<br />get interviews
            </h2>
            <p style={{ color: '#93C5FD', fontSize: 13, lineHeight: 1.7, margin: '0 0 2rem' }}>
              AI-powered writing, ATS scoring, cover letters, and LinkedIn bios from NepAstra in one focused workspace.
            </p>

            {/* Features */}
            <div className="auth-sidebar-features" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map(f => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{f.icon}</div>
                  <span style={{ color: '#DBEAFE', fontSize: 13 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 24 }}>
            <p style={{ color: '#93C5FD', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              🔒 Your data is encrypted and saved securely. Free to use — Pro features unlock AI writing.
            </p>
          </div>
        </aside>

        {/* ── RIGHT — FORM ── */}
        <main id="main-content" className="auth-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f9fafb' }}>
          <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.3s ease' }}>

            {/* Welcome text */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                {forgotMode ? 'Reset your password' : tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                {forgotMode ? 'Enter your email and we\'ll send a reset link'
                  : tab === 'signin' ? 'Sign in to access your resumes'
                    : 'Free to start — no credit card required'}
              </p>
            </div>

            {/* Card */}
            <div className="auth-card" style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3f4f6', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '1.75rem' }}>

              {/* Tab switcher */}
              {!forgotMode && (
                <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 24 }}>
                  {(['signin', 'signup'] as const).map((t, i) => (
                    <button key={t} type="button" onClick={() => switchTab(t)} disabled={isLoading} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 500, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: tab === t ? '#1D4ED8' : 'transparent', color: tab === t ? '#fff' : '#6b7280', opacity: isLoading ? 0.6 : 1, fontFamily: 'inherit' }}>
                      {i === 0 ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div role="status" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✓</span> {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {tab === 'signup' && !forgotMode && (
                  <div>
                    <label htmlFor="auth-name" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>Full name</label>
                    <input id="auth-name" type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} disabled={isLoading} autoComplete="name" style={inp} />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>Email address</label>
                  <input id="auth-email" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required autoComplete="email" style={inp} />
                </div>

                {!forgotMode && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label htmlFor="auth-password" style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Password</label>
                      {tab === 'signin' && (
                        <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }} style={{ fontSize: 11, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div style={{ position: 'relative',zIndex: 9999 }}>
                      <input type={showPass ? 'text' : 'password'} placeholder={tab === 'signin' ? '••••••••' : 'Min. 8 characters'} value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required minLength={tab === 'signup' ? 8 : undefined} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: 0 }}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                    {tab === 'signup' && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>At least 8 characters</p>}
                  </div>
                )}

                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#93C5FD' : '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', fontFamily: 'inherit' }}>
                  {loading ? (
                    <><Spin light />{forgotMode ? 'Sending…' : tab === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                  ) : (
                    forgotMode ? 'Send reset link' : tab === 'signin' ? 'Sign in' : 'Create account'
                  )}
                </button>

                {forgotMode && (
                  <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    ← Back to sign in
                  </button>
                )}
              </form>

              {/* Divider + Google — hidden in forgot mode */}
              {!forgotMode && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                  </div>

                  <button type="button" onClick={handleGoogle} disabled={isLoading} style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.15s', fontFamily: 'inherit' }}>
                    {gLoading ? <><Spin /> Connecting…</> : <><GoogleIcon /> Continue with Google</>}
                  </button>
                </>
              )}

              {/* Switch tab text */}
              {!forgotMode && (
                <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 20, marginBottom: 0 }}>
                  {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')} disabled={isLoading} style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    {tab === 'signin' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              )}
            </div>

            {/* Terms */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

function Spin({ light }: { light?: boolean }) {
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid', borderColor: light ? 'rgba(255,255,255,0.3)' : '#e5e7eb', borderTopColor: light ? '#fff' : '#1D4ED8', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z" />
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}
