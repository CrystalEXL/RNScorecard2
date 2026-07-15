'use client';

import { useState } from 'react';
import { signOutUser } from '@/lib/useAuth';
import { YEARS } from '@/lib/scoring';
import ChangePasswordModal from './ChangePasswordModal';

function tabStyle(active) {
  const base = {
    padding: '11px 18px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '9px 9px 0 0',
  };
  return active ? { ...base, color: '#233B3C', background: '#F4F1EA' } : { ...base, color: '#9fb2b0' };
}

const btnOutline = {
  display: 'flex', alignItems: 'center', gap: '7px',
  background: 'transparent', color: '#cdd9d7', border: '1px solid #3d5a5b',
  borderRadius: '9px', padding: '8px 13px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
};

export default function Header({ managers, managerId, onManagerChange, view, onNavigate, year, onYearChange }) {
  const [showPwModal, setShowPwModal] = useState(false);

  return (
    <>
      <header style={{ background: '#233B3C', color: '#F4F1EA' }}>
        <div style={{ maxWidth: '1220px', margin: '0 auto', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0E5B57', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '13px' }}>
              RN
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15px', letterSpacing: '-.01em', lineHeight: 1 }}>
                Scorecard
              </div>
              <div style={{ fontSize: '11px', color: '#9fb2b0', marginTop: '3px' }}>RN Performance · FY{year}</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#9fb2b0' }}>Year</span>
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              style={{ background: '#2f4b4c', color: '#F4F1EA', border: '1px solid #3d5a5b', borderRadius: '9px', padding: '8px 12px', fontSize: '13px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#9fb2b0' }}>Manager</span>
            <select
              value={managerId}
              onChange={(e) => onManagerChange(e.target.value)}
              style={{ background: '#2f4b4c', color: '#F4F1EA', border: '1px solid #3d5a5b', borderRadius: '9px', padding: '8px 12px', fontSize: '13px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All managers</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowPwModal(true)} title="Change password" style={btnOutline}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="15.5" r="4.5"></circle>
              <path d="m10.7 12.3 8.3-8.3 2 2-2 2 2 2-2.5 2.5-2-2-1 1"></path>
            </svg>
            Change Password
          </button>
          <button onClick={signOutUser} style={btnOutline}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Sign out
          </button>
        </div>
        <div style={{ maxWidth: '1220px', margin: '0 auto', padding: '0 28px', display: 'flex', gap: '4px' }}>
          <button onClick={() => onNavigate('roster')} style={tabStyle(view === 'roster')}>Team Roster</button>
          <button onClick={() => onNavigate('entry')} style={tabStyle(view === 'entry')}>Enter Scores</button>
          <button onClick={() => onNavigate('bonus')} style={tabStyle(view === 'bonus')}>Bonus Report</button>
        </div>
      </header>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </>
  );
}
