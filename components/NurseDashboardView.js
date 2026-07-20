'use client';

import {
  METRICS, PENALTIES, MONTH_NAMES, fmt, rawFmt, colorFor, penaltyColor, pillStyle, initials, avatarColors,
  quarterAvg, annualAvg, latestMonth, isBonusEligible, computeTotal, entryId,
} from '@/lib/scoring';

const BREAKDOWN_COLS = [...METRICS, ...PENALTIES];

export default function NurseDashboardView({ nurse, nurses, entries, year, managerName, onBack, onSwitchNurse, onEditMonth }) {
  const [avaBg, avaFg] = avatarColors(nurse.id);

  const monthRows = MONTH_NAMES.map((nm, i) => {
    const mo = i + 1;
    const rec = entries[entryId(year, mo)];
    const total = rec ? (rec.total != null ? rec.total : computeTotal(rec.scores)) : null;
    const cells = BREAKDOWN_COLS.map((m) => {
      const isPenalty = PENALTIES.some((p) => p.key === m.key);
      return {
        txt: rec ? rawFmt(rec.scores[m.key]) : '—',
        color: rec
          ? (rec.scores[m.key] === 'NA' ? '#98a09d' : (isPenalty ? penaltyColor(rec.scores[m.key]) : colorFor(Number(rec.scores[m.key]))))
          : '#c4c8c2',
      };
    });
    return {
      mo,
      label: nm.slice(0, 3),
      cells,
      total: fmt(total),
      totalStyle: pillStyle(total),
      rowStyle: rec ? {} : { opacity: 0.5 },
      hasData: !!rec,
    };
  });

  const quarters = [1, 2, 3, 4].map((qi) => {
    const qa = quarterAvg(entries, year, qi);
    const elig = isBonusEligible(qa.avg);
    const has = qa.count > 0;
    return {
      label: 'Q' + qi,
      avg: fmt(qa.avg),
      color: colorFor(qa.avg),
      monthsLabel: has ? `${qa.count} of 3 months` : 'Not scored',
      badge: !has ? '—' : (elig ? 'Bonus' : 'No bonus'),
      badgeStyle: !has
        ? { padding: '3px 9px', borderRadius: '20px', background: '#EDEAE1', color: '#98a09d', fontSize: '11px', fontWeight: 600 }
        : (elig
          ? { padding: '3px 9px', borderRadius: '20px', background: '#E1F0E7', color: '#0F6B3E', fontSize: '11px', fontWeight: 600 }
          : { padding: '3px 9px', borderRadius: '20px', background: '#F6E0DA', color: '#A3331F', fontSize: '11px', fontWeight: 600 }),
      cardStyle: {
        background: '#fff',
        border: `1px solid ${elig && has ? '#BADEC9' : '#E7E2D8'}`,
        borderRadius: '13px',
        padding: '16px 18px',
        boxShadow: elig && has ? '0 0 0 1px #BADEC9 inset' : 'none',
      },
    };
  });

  let bonusCount = 0, qtrCount = 0;
  for (let qi = 1; qi <= 4; qi++) {
    const qa = quarterAvg(entries, year, qi);
    if (qa.count > 0) { qtrCount++; if (isBonusEligible(qa.avg)) bonusCount++; }
  }
  const lm = latestMonth(entries, year);
  const ann = annualAvg(entries, year);

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#0E5B57', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
        Back to roster
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: avaBg, color: avaFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '20px', fontFamily: "'Space Grotesk'" }}>{initials(nurse.name)}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: '26px', fontWeight: 600, margin: 0, letterSpacing: '-.02em' }}>{nurse.name}</h2>
          <p style={{ margin: '3px 0 0', color: '#6b7674', fontSize: '14px' }}>Reports to {managerName(nurse.managerId)}</p>
        </div>
        <select value={nurse.id} onChange={(e) => onSwitchNurse(e.target.value)} style={{ padding: '10px 13px', border: '1.5px solid #ded7c8', borderRadius: '10px', background: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
          {nurses.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        <StatCard label="Latest Month" value={lm ? fmt(lm.total) : '—'} valueColor={colorFor(lm ? lm.total : null)} suffix={lm ? MONTH_NAMES[lm.mo - 1] : '—'} />
        <StatCard label="YTD Average" value={fmt(ann)} valueColor={colorFor(ann)} suffix="/ 5.0" />
        <StatCard label="Bonus Quarters" value={String(bonusCount)} valueColor="#1B2A2C" suffix={`of ${qtrCount} scored`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {quarters.map((q) => (
          <div key={q.label} style={q.cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '14px', color: '#1B2A2C' }}>{q.label}</div>
              <span style={q.badgeStyle}>{q.badge}</span>
            </div>
            <div style={{ fontFamily: "'Space Grotesk'", fontSize: '30px', fontWeight: 600, lineHeight: 1, color: q.color }}>{q.avg}</div>
            <div style={{ fontSize: '12px', color: '#98a09d', marginTop: '6px' }}>{q.monthsLabel}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EBE6DB', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15px' }}>
          Monthly Breakdown · {year}
          <span style={{ fontWeight: 500, color: '#98a09d', fontSize: '12.5px', marginLeft: '10px' }}>Click a month to edit or add its scores</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '760px' }}>
            <thead>
              <tr style={{ background: '#FAF8F2', borderBottom: '1px solid #EBE6DB', color: '#7b847f', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                <th style={{ textAlign: 'left', padding: '11px 20px', fontWeight: 600 }}>Month</th>
                {BREAKDOWN_COLS.map((m) => (
                  <th key={m.key} style={{ textAlign: 'center', padding: '11px 8px', fontWeight: 600 }}>
                    {m.short}
                    <div style={{ fontWeight: 500, color: '#b3b8b2', fontSize: '10px' }}>{m.weight != null ? `${m.weight}%` : '0/-1'}</div>
                  </th>
                ))}
                <th style={{ textAlign: 'center', padding: '11px 20px', fontWeight: 600, color: '#0E5B57' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((row) => (
                <tr
                  key={row.label}
                  onClick={() => onEditMonth(nurse.id, row.mo)}
                  title={row.hasData ? 'Edit this month’s scores' : 'Add scores for this month'}
                  style={{ borderBottom: '1px solid #F2EEE4', cursor: 'pointer', ...row.rowStyle }}
                >
                  <td style={{ padding: '11px 20px', fontWeight: 600, color: '#4b5654' }}>{row.label}</td>
                  {row.cells.map((cell, i) => (
                    <td key={i} style={{ padding: '11px 8px', textAlign: 'center', fontFamily: "'Space Grotesk'", color: cell.color }}>{cell.txt}</td>
                  ))}
                  <td style={{ padding: '11px 20px', textAlign: 'center' }}><span style={row.totalStyle}>{row.total}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor, suffix }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '13px', padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#7b847f', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontFamily: "'Space Grotesk'", fontSize: '32px', fontWeight: 600, color: valueColor }}>{value}</span>
        <span style={{ fontSize: '13px', color: '#98a09d' }}>{suffix}</span>
      </div>
    </div>
  );
}
