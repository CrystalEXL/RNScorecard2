'use client';

import { useState } from 'react';
import { changeOwnPassword } from '@/lib/useAuth';

const fieldInput = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '15px',
  border: '1.5px solid #d6cfbf',
  borderRadius: '10px',
  background: '#fff',
  outline: 'none',
  marginBottom: '14px',
};

const label = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#7b847f',
  marginBottom: '6px',
};

export default function ChangePasswordModal({ onClose }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setErr('');
    setMsg('');
    if (next.length < 6) {
      setErr('New password must be at least 6 characters.');
      return;
    }
    if (next !== conf) {
      setErr('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changeOwnPassword(cur, next);
      setMsg('Password updated.');
      setCur(''); setNext(''); setConf('');
      setTimeout(onClose, 1200);
    } catch (e) {
      const code = e?.code || '';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setErr('Current password is incorrect.');
      } else {
        setErr(e?.message || 'Could not update password.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,32,33,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '380px', background: '#F4F1EA', borderRadius: '16px', padding: '28px', boxShadow: '0 30px 70px rgba(0,0,0,.35)' }}
      >
        <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '19px', marginBottom: '4px' }}>
          Change password
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#6b7674' }}>
          Enter your current password, then set a new one.
        </p>

        <label style={label}>Current password</label>
        <input type="password" value={cur} onChange={(e) => { setCur(e.target.value); setErr(''); setMsg(''); }} style={fieldInput} autoComplete="current-password" />

        <label style={label}>New password</label>
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setErr(''); setMsg(''); }} style={fieldInput} autoComplete="new-password" />

        <label style={label}>Confirm new password</label>
        <input
          type="password"
          value={conf}
          onChange={(e) => { setConf(e.target.value); setErr(''); setMsg(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
          style={{ ...fieldInput, marginBottom: '6px' }}
          autoComplete="new-password"
        />

        {err && <div style={{ color: '#A3331F', fontSize: '13px', fontWeight: 600, margin: '8px 0 0' }}>{err}</div>}
        {msg && <div style={{ color: '#0F6B3E', fontSize: '13px', fontWeight: 600, margin: '8px 0 0' }}>{msg}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onSave}
            disabled={busy}
            style={{ flex: 1, background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#6b7674', border: '1.5px solid #ded7c8', borderRadius: '10px', padding: '12px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
