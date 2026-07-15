'use client';

import { useMemo, useState } from 'react';
import {
  fmt, pillStyle, initials, avatarColors, annualAvg, latestMonth, quarterAvg, isBonusEligible,
} from '@/lib/scoring';
import { addNurse, deactivateNurse, updateNurseManager } from '@/lib/data';

const inputBase = {
  width: '100%',
  padding: '11px 13px',
  border: '1.5px solid #ded7c8',
  borderRadius: '10px',
  background: '#fff',
  fontSize: '14px',
  outline: 'none',
};

export default function RosterView({
  nurses, managers, entriesByNurse, year, managerName, scopeLabel,
  search, onSearchChange, onOpenNurse, onGoEntry, currentManagerId, managerFilterId,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newManagerId, setNewManagerId] = useState(managerFilterId !== 'all' ? managerFilterId : '');
  const [addError, setAddError] = useState('');

  const filtered = useMemo(() => {
    const s = (search || '').toLowerCase();
    return nurses
      .filter((n) => !s || n.name.toLowerCase().includes(s))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [nurses, search]);

  const rows = useMemo(() => {
    return filtered.map((n) => {
      const entries = entriesByNurse[n.id] || {};
      const lm = latestMonth(entries, year);
      const ytd = annualAvg(entries, year);
      let bonusOK = 0, bonusScored = 0;
      for (let qi = 1; qi <= 4; qi++) {
        const qa = quarterAvg(entries, year, qi);
        if (qa.count > 0) { bonusScored++; if (isBonusEligible(qa.avg)) bonusOK++; }
      }
      const [avaBg, avaFg] = avatarColors(n.id);
      const statusOK = ytd != null && ytd >= 3.5;
      return {
        id: n.id,
        name: n.name,
        manager: managerName(n.managerId),
        initials: initials(n.name),
        avaBg, avaFg,
        latest: lm ? fmt(lm.total) : '—',
        latestStyle: pillStyle(lm ? lm.total : null),
        ytd: fmt(ytd),
        ytdStyle: pillStyle(ytd),
        bonusQ: bonusScored ? `${bonusOK}/${bonusScored}` : '—',
        status: ytd == null ? 'No data' : (statusOK ? 'On track' : 'Below target'),
        statusStyle: statusPillStyle(ytd, statusOK),
      };
    });
  }, [filtered, entriesByNurse, year, managerName]);

  const onAddNurse = async () => {
    if (!newName.trim()) { setAddError('Enter a nurse name.'); return; }
    try {
      await addNurse({ name: newName.trim(), managerId: newManagerId || '' });
      setShowAdd(false);
      setNewName('');
      setAddError('');
    } catch (e) {
      setAddError(e?.message || 'Could not add nurse.');
    }
  };

  const onRemove = async (n, e) => {
    e.stopPropagation();
    if (window.confirm(`Remove ${n.name} from the roster? Their scores are kept but hidden.`)) {
      await deactivateNurse(n.id);
    }
  };

  const onChangeManager = async (nurseId, managerId, e) => {
    e.stopPropagation();
    await updateNurseManager(nurseId, managerId);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: '26px', fontWeight: 600, margin: '0 0 4px', letterSpacing: '-.02em' }}>Team Roster</h2>
          <p style={{ margin: 0, color: '#6b7674', fontSize: '14px' }}>{filtered.length} nurses · {scopeLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98a09d" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m21 21-4-4"></path>
            </svg>
            <input
              type="text"
              placeholder="Search nurse"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ padding: '11px 14px 11px 36px', width: '250px', border: '1.5px solid #ded7c8', borderRadius: '10px', background: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#fff', color: '#0E5B57', border: '1.5px solid #0E5B57', borderRadius: '10px', padding: '10px 15px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M19 8v6M22 11h-6"></path>
            </svg>
            Add Nurse
          </button>
          <button
            onClick={onGoEntry}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            New Entry
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15px', marginBottom: '14px' }}>Add a nurse to the roster</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={fieldLabel}>Full name</label>
              <input
                type="text"
                placeholder="e.g. Jordan Ellis"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setAddError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') onAddNurse(); }}
                style={inputBase}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <label style={fieldLabel}>Manager</label>
              <select value={newManagerId} onChange={(e) => { setNewManagerId(e.target.value); setAddError(''); }} style={{ ...inputBase, padding: '12px 13px', cursor: 'pointer' }}>
                <option value="">— No manager assigned —</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <button onClick={onAddNurse} style={{ background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            <button onClick={() => { setShowAdd(false); setAddError(''); }} style={{ background: 'transparent', color: '#6b7674', border: '1.5px solid #ded7c8', borderRadius: '10px', padding: '12px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
          {addError && <div style={{ color: '#A3331F', fontSize: '13px', fontWeight: 600, marginTop: '10px' }}>{addError}</div>}
          {managers.length === 0 && (
            <div style={{ color: '#8A5A12', fontSize: '12.5px', marginTop: '10px' }}>
              No managers registered yet — you can still add nurses with no manager assigned, and assign one later once a manager has signed in.
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '820px' }}>
            <thead>
              <tr style={{ background: '#FAF8F2', borderBottom: '1px solid #EBE6DB', color: '#7b847f', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <th style={{ textAlign: 'left', padding: '13px 20px', fontWeight: 600 }}>Nurse</th>
                <th style={{ textAlign: 'left', padding: '13px 12px', fontWeight: 600 }}>Manager</th>
                <th style={{ textAlign: 'center', padding: '13px 12px', fontWeight: 600 }}>Latest</th>
                <th style={{ textAlign: 'center', padding: '13px 12px', fontWeight: 600 }}>YTD Avg</th>
                <th style={{ textAlign: 'center', padding: '13px 12px', fontWeight: 600 }}>Bonus Qtrs</th>
                <th style={{ textAlign: 'left', padding: '13px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '13px 16px', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const n = filtered.find((x) => x.id === r.id);
                return (
                  <tr key={r.id} onClick={() => onOpenNurse(r.id)} style={{ borderBottom: '1px solid #F0ECE2', cursor: 'pointer' }}>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: r.avaBg, color: r.avaFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', fontFamily: "'Space Grotesk'", flexShrink: 0 }}>{r.initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1B2A2C' }}>{r.name}</div>
                          <div style={{ fontSize: '12px', color: '#98a09d' }}>Registered Nurse</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 12px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={n?.managerId || ''}
                        onChange={(e) => onChangeManager(r.id, e.target.value, e)}
                        style={{ padding: '7px 9px', border: '1.5px solid #ded7c8', borderRadius: '8px', background: '#fff', fontSize: '13px', color: '#4b5654', outline: 'none', cursor: 'pointer', maxWidth: '160px' }}
                      >
                        <option value="">— None —</option>
                        {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '13px 12px', textAlign: 'center' }}><span style={r.latestStyle}>{r.latest}</span></td>
                    <td style={{ padding: '13px 12px', textAlign: 'center' }}><span style={r.ytdStyle}>{r.ytd}</span></td>
                    <td style={{ padding: '13px 12px', textAlign: 'center', fontFamily: "'Space Grotesk'", fontWeight: 500, color: '#4b5654' }}>{r.bonusQ}</td>
                    <td style={{ padding: '13px 20px' }}><span style={r.statusStyle}>{r.status}</span></td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <button onClick={(e) => onRemove(n, e)} title="Remove nurse" style={{ background: 'transparent', border: 'none', color: '#b6bcb6', cursor: 'pointer', padding: '6px', borderRadius: '7px', display: 'inline-flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '44px', textAlign: 'center', color: '#98a09d', fontSize: '14px' }}>No nurses match your search.</div>
        )}
      </div>
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#7b847f',
  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '7px',
};

function statusPillStyle(ytd, statusOK) {
  const base = { display: 'inline-block', padding: '4px 11px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600 };
  if (ytd == null) return { ...base, background: '#EDEAE1', color: '#98a09d' };
  return statusOK ? { ...base, background: '#E1F0E7', color: '#0F6B3E' } : { ...base, background: '#F6E0DA', color: '#A3331F' };
}
