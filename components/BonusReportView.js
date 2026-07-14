'use client';

import { useMemo } from 'react';
import { fmt, pillStyle, initials, avatarColors, quarterAvg, isBonusEligible, YEAR } from '@/lib/scoring';

const QUARTER_LABELS = ['', 'Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];

export default function BonusReportView({ nurses, entriesByNurse, scopeLabel, bonusQuarter, onQuarterChange, managerName }) {
  const bq = Number(bonusQuarter);

  const rows = useMemo(() => {
    let el = 0, not = 0, pend = 0;
    const list = nurses.map((n) => {
      const entries = entriesByNurse[n.id] || {};
      const qa = quarterAvg(entries, bq);
      const [avaBg, avaFg] = avatarColors(n.id);
      const has = qa.count > 0;
      const elig = has && isBonusEligible(qa.avg);
      if (!has) pend++; else if (elig) el++; else not++;
      return {
        sort: has ? qa.avg : -1,
        id: n.id, name: n.name, initials: initials(n.name), avaBg, avaFg,
        months: has ? `${qa.count}/3` : '0/3',
        avg: fmt(qa.avg), avgStyle: pillStyle(qa.avg),
        badge: !has ? 'Pending' : (elig ? 'Eligible' : 'Not eligible'),
        badgeStyle: badgeStyleFor(has, elig),
      };
    }).sort((a, b) => b.sort - a.sort);
    return { list, el, not, pend };
  }, [nurses, entriesByNurse, bq]);

  const onExport = () => {
    const esc = (v) => {
      v = String(v == null ? '' : v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    const header = ['Nurse', 'Manager', 'Quarter', 'Months Scored', 'Quarterly Average', 'Bonus Eligible'];
    const csvRows = [header];
    nurses
      .map((n) => {
        const entries = entriesByNurse[n.id] || {};
        const qa = quarterAvg(entries, bq);
        const has = qa.count > 0;
        const elig = has && isBonusEligible(qa.avg);
        return {
          name: n.name,
          manager: managerName(n.managerId),
          months: has ? `${qa.count}/3` : '0/3',
          avg: qa.avg == null ? '' : fmt(qa.avg),
          status: !has ? 'Pending' : (elig ? 'Eligible' : 'Not eligible'),
          sort: has ? qa.avg : -1,
        };
      })
      .sort((a, b) => b.sort - a.sort)
      .forEach((r) => {
        csvRows.push([r.name, r.manager, `Q${bq} (${QUARTER_LABELS[bq]})`, r.months, r.avg, r.status]);
      });
    const csv = csvRows.map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RN-Scorecard-Bonus-Q${bq}-${YEAR}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontSize: '26px', fontWeight: 600, margin: '0 0 4px', letterSpacing: '-.02em' }}>Bonus Eligibility</h2>
          <p style={{ margin: 0, color: '#6b7674', fontSize: '14px' }}>Quarterly average ≥ 3.5 qualifies for the bonus · {scopeLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={bonusQuarter} onChange={(e) => onQuarterChange(e.target.value)} style={{ padding: '11px 15px', border: '1.5px solid #ded7c8', borderRadius: '10px', background: '#fff', fontSize: '14px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            <option value="1">Q1 · Jan–Mar</option>
            <option value="2">Q2 · Apr–Jun</option>
            <option value="3">Q3 · Jul–Sep</option>
            <option value="4">Q4 · Oct–Dec</option>
          </select>
          <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <path d="M7 10l5 5 5-5"></path>
              <path d="M12 15V3"></path>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        <StatCard label="Eligible" value={rows.el} color="#0F6B3E" />
        <StatCard label="Not Eligible" value={rows.not} color="#A3331F" />
        <StatCard label="Not Yet Scored" value={rows.pend} color="#98a09d" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '640px' }}>
            <thead>
              <tr style={{ background: '#FAF8F2', borderBottom: '1px solid #EBE6DB', color: '#7b847f', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <th style={{ textAlign: 'left', padding: '13px 20px', fontWeight: 600 }}>Nurse</th>
                <th style={{ textAlign: 'center', padding: '13px 12px', fontWeight: 600 }}>Months Scored</th>
                <th style={{ textAlign: 'center', padding: '13px 12px', fontWeight: 600 }}>{QUARTER_LABELS[bq]} Avg</th>
                <th style={{ textAlign: 'left', padding: '13px 20px', fontWeight: 600 }}>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {rows.list.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #F0ECE2' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: b.avaBg, color: b.avaFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', fontFamily: "'Space Grotesk'", flexShrink: 0 }}>{b.initials}</div>
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 12px', textAlign: 'center', fontFamily: "'Space Grotesk'", color: '#4b5654' }}>{b.months}</td>
                  <td style={{ padding: '13px 12px', textAlign: 'center' }}><span style={b.avgStyle}>{b.avg}</span></td>
                  <td style={{ padding: '13px 20px' }}><span style={b.badgeStyle}>{b.badge}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7E2D8', borderRadius: '13px', padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#7b847f', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk'", fontSize: '32px', fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function badgeStyleFor(has, elig) {
  const base = { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600 };
  if (!has) return { ...base, background: '#EDEAE1', color: '#98a09d' };
  return elig ? { ...base, background: '#E1F0E7', color: '#0F6B3E' } : { ...base, background: '#F6E0DA', color: '#A3331F' };
}
