'use client';

import { useEffect, useState } from 'react';
import {
  METRICS, SCORE_OPTIONS, MONTH_NAMES, SCORE_KEY_COLS, SCORE_KEY,
  YEAR, computeTotal, fmt, badge, entryId,
} from '@/lib/scoring';
import { saveEntry } from '@/lib/data';

const selectBase = {
  width: '100%', padding: '12px 13px', border: '1.5px solid #ded7c8', borderRadius: '10px',
  background: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer',
};

const fieldLabel = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#7b847f',
  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '7px',
};

function blankScores() {
  const s = {};
  METRICS.forEach((m) => { s[m.key] = ''; });
  return s;
}

export default function EntryView({ nurses, entriesByNurse, uid, initialNurseId }) {
  const [showKey, setShowKey] = useState(false);
  const [nurseId, setNurseId] = useState(initialNurseId || (nurses[0] && nurses[0].id) || '');
  const [month, setMonth] = useState('6');
  const [scores, setScores] = useState(blankScores());
  const [existed, setExisted] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialNurseId) setNurseId(initialNurseId);
  }, [initialNurseId]);

  useEffect(() => {
    const entries = entriesByNurse[nurseId] || {};
    const rec = entries[entryId(month)];
    if (rec) {
      const next = {};
      METRICS.forEach((m) => { next[m.key] = String(rec.scores[m.key]); });
      setScores(next);
      setExisted(true);
    } else {
      setScores(blankScores());
      setExisted(false);
    }
    setSavedMsg('');
    setErrMsg('');
  }, [nurseId, month, entriesByNurse]);

  const liveTotal = computeTotal(scores);
  const lb = badge(liveTotal);
  const liveBadgeLabel = liveTotal == null ? 'Complete all 6 metrics' : (liveTotal >= 3.5 ? 'Bonus eligible pace' : 'Below bonus threshold');
  const liveColor = liveTotal == null ? '#5f7a78' : (liveTotal >= 4.5 ? '#7BD6A0' : liveTotal >= 3.5 ? '#8FD3CE' : liveTotal >= 3 ? '#E0B96B' : '#E39A8C');
  const liveBadgeStyle = liveTotal == null
    ? { display: 'inline-block', marginTop: '14px', padding: '5px 12px', borderRadius: '8px', background: '#33504f', color: '#9fb2b0', fontSize: '12.5px', fontWeight: 600 }
    : (liveTotal >= 3.5
      ? { display: 'inline-block', marginTop: '14px', padding: '5px 12px', borderRadius: '8px', background: '#1c4d3a', color: '#8FE3B8', fontSize: '12.5px', fontWeight: 600 }
      : { display: 'inline-block', marginTop: '14px', padding: '5px 12px', borderRadius: '8px', background: '#4d2c26', color: '#E39A8C', fontSize: '12.5px', fontWeight: 600 });

  const onSave = async () => {
    for (const m of METRICS) {
      if (!scores[m.key]) { setErrMsg('Please score every metric before saving.'); setSavedMsg(''); return; }
    }
    const rec = {};
    METRICS.forEach((m) => { rec[m.key] = scores[m.key] === 'NA' ? 'NA' : Number(scores[m.key]); });
    setSaving(true);
    try {
      const total = await saveEntry({ nurseId, month, scores: rec, uid });
      const nurse = nurses.find((n) => n.id === nurseId);
      setExisted(true);
      setErrMsg('');
      setSavedMsg(`Saved — ${(nurse?.name || '').split(' ')[0]} scored ${fmt(total)} for ${MONTH_NAMES[Number(month) - 1]}.`);
    } catch (e) {
      setErrMsg(e?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const scoreKeyCols = SCORE_KEY_COLS.map((c) => {
    const b = badge(Number(c));
    return { label: c, bg: b.bg, fg: b.fg };
  });
  const scoreKeyRows = METRICS.map((m) => ({
    label: m.label,
    weight: m.weight + '%',
    cells: SCORE_KEY_COLS.map((c) => ({ v: (SCORE_KEY[m.key] && SCORE_KEY[m.key][c]) || '—' })),
  }));

  return (
    <div style={{ maxWidth: '940px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: '26px', fontWeight: 600, margin: 0, letterSpacing: '-.02em' }}>Enter Monthly Scores</h2>
        <button
          onClick={() => setShowKey((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#fff', color: '#0E5B57', border: '1.5px solid #0E5B57', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4M12 8h.01"></path>
          </svg>
          Scoring Key
        </button>
      </div>
      <p style={{ margin: '6px 0 20px', color: '#6b7674', fontSize: '14px' }}>
        Score each metric 1–5 (or NA). The monthly total is the weighted average, calculated automatically.
      </p>

      {showKey && (
        <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', overflow: 'hidden', marginBottom: '22px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EBE6DB' }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15px' }}>Scoring Key</div>
            <div style={{ fontSize: '12.5px', color: '#98a09d', marginTop: '3px' }}>Raw performance thresholds that map to each score. Blank / TBD cells are not yet defined.</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '680px' }}>
              <thead>
                <tr style={{ background: '#FAF8F2', borderBottom: '1px solid #EBE6DB' }}>
                  <th style={{ textAlign: 'left', padding: '11px 20px', fontSize: '11px', fontWeight: 600, color: '#7b847f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Metric</th>
                  {scoreKeyCols.map((c) => (
                    <th key={c.label} style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', minWidth: '38px', padding: '3px 8px', borderRadius: '7px', background: c.bg, color: c.fg, fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '12.5px' }}>{c.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreKeyRows.map((row) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid #F2EEE4' }}>
                    <td style={{ padding: '11px 20px' }}>
                      <span style={{ fontWeight: 600, color: '#1B2A2C' }}>{row.label}</span>{' '}
                      <span style={{ color: '#b3b8b2', fontSize: '12px' }}>{row.weight}</span>
                    </td>
                    {row.cells.map((cell, i) => (
                      <td key={i} style={{ padding: '11px 6px', textAlign: 'center', fontFamily: "'Space Grotesk'", color: '#4b5654' }}>{cell.v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', padding: '26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label style={fieldLabel}>Nurse</label>
              <select value={nurseId} onChange={(e) => setNurseId(e.target.value)} style={selectBase}>
                {nurses.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Month · {YEAR}</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectBase}>
                {MONTH_NAMES.map((nm, i) => <option key={i} value={String(i + 1)}>{nm}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {METRICS.map((m) => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1B2A2C' }}>{m.label}</div>
                  <div style={{ fontSize: '12px', color: '#98a09d' }}>Weight {m.weight}%</div>
                </div>
                <select
                  value={scores[m.key] || ''}
                  onChange={(e) => { setScores((s) => ({ ...s, [m.key]: e.target.value })); setSavedMsg(''); setErrMsg(''); }}
                  style={{ width: '110px', padding: '11px 12px', border: '1.5px solid #ded7c8', borderRadius: '10px', background: '#fff', fontSize: '15px', fontFamily: "'Space Grotesk'", fontWeight: 500, outline: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  <option value="">—</option>
                  {SCORE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={onSave} disabled={saving} style={{ background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px 24px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Scorecard'}
            </button>
            {savedMsg && (
              <span style={{ color: '#0F6B3E', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                {savedMsg}
              </span>
            )}
            {errMsg && <span style={{ color: '#A3331F', fontSize: '13.5px', fontWeight: 600 }}>{errMsg}</span>}
          </div>
        </div>

        <div style={{ background: '#233B3C', color: '#F4F1EA', borderRadius: '14px', padding: '26px', position: 'sticky', top: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9fb2b0', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>Weighted Monthly Total</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontSize: '54px', fontWeight: 600, lineHeight: 1, color: liveColor }}>{fmt(liveTotal)}</div>
            <div style={{ fontSize: '16px', color: '#9fb2b0' }}>/ 5.0</div>
          </div>
          <div style={liveBadgeStyle}>{liveBadgeLabel}</div>
          <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #3a5556' }}>
            <div style={{ fontSize: '12.5px', color: '#9fb2b0', lineHeight: 1.6 }}>
              Nurses averaging <b style={{ color: '#F4F1EA' }}>3.5 or higher</b> across a quarter earn the quarterly bonus.
            </div>
          </div>
          {existed && (
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#e0b96b', background: '#3a4f45', padding: '9px 12px', borderRadius: '8px' }}>
              Editing an existing entry for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
