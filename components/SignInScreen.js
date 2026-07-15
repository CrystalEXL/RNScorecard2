'use client';

import { useState } from 'react';
import { signIn, resetPassword } from '@/lib/useAuth';

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  fontSize: '15px',
  border: '1.5px solid #d6cfbf',
  borderRadius: '11px',
  background: '#fff',
  outline: 'none',
  marginBottom: '12px',
};

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?".');
      return;
    }
    try {
      await resetPassword(email.trim());
      setNotice('Password reset email sent — check your inbox.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#233B3C',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#F4F1EA',
          borderRadius: '18px',
          padding: '40px 36px',
          boxShadow: '0 30px 70px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: '#0E5B57',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: "'Space Grotesk'",
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            RN
          </div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '16px', letterSpacing: '-.01em' }}>
            Case Manager Scorecard
          </div>
        </div>

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#EAE4D6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E5B57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: '24px', fontWeight: 600, margin: '0 0 6px', letterSpacing: '-.02em' }}>
          Sign in
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: '14px', color: '#5c6a68', lineHeight: 1.5 }}>
          Sign in with your manager account to view and enter nurse scorecards.
        </p>

        <form onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            style={inputStyle}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            style={{ ...inputStyle, letterSpacing: '.05em' }}
            autoComplete="current-password"
          />

          {error && (
            <div style={{ color: '#A3331F', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{error}</div>
          )}
          {notice && (
            <div style={{ color: '#0F6B3E', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{notice}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#fff',
              background: '#0E5B57',
              border: 'none',
              borderRadius: '11px',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onForgot}
            style={{ background: 'none', border: 'none', color: '#0E5B57', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again shortly.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  return err?.message || 'Something went wrong. Try again.';
}
