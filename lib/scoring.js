export const DEFAULT_YEAR = 2026;
export const YEARS = [2026, 2027, 2028];

export const METRICS = [
  { key: 'reliability', label: 'Reliability', short: 'Rel', weight: 15 },
  { key: 'productivity', label: 'Productivity', short: 'Prod', weight: 20 },
  { key: 'quality', label: 'Quality', short: 'Qual', weight: 20 },
  { key: 'refusal', label: 'Refusal Rate', short: 'Ref', weight: 15 },
  { key: 'careplan', label: 'Care Plan Completion', short: 'Care', weight: 20 },
  { key: 'compliance', label: 'Compliance', short: 'Comp', weight: 10 },
];

export const SCORE_OPTIONS = ['1', '2', '3', '3.5', '4', '4.5', '5', 'NA'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SCORE_KEY_COLS = ['5', '4.5', '4', '3.5', '3', '2', '1'];
export const SCORE_KEY = {
  reliability: { '5': '100%', '4.5': '99%', '4': '97%', '3.5': '96%', '3': '95%', '2': '90%', '1': '<90%' },
  productivity: {
    '5': 'Exceptional', '4.5': 'Highly Effective', '4': 'Exceeds Expectations',
    '3.5': 'Meets Expectations', '3': 'Approaching Expectations', '2': 'Below Expectations', '1': 'Unacceptable',
  },
  quality: { '5': '100%', '4.5': '98%', '4': '97%', '3.5': '95%', '3': '93%', '2': '92%', '1': '<90%' },
  refusal: { '5': '≤2%', '4.5': '3%', '4': '4%', '3.5': '5%', '3': '6%', '2': '7%', '1': '≥8%' },
  careplan: { '5': '100%', '4.5': '98%', '4': '96%', '3.5': '95%', '3': '94%', '2': '92%', '1': '<92%' },
  compliance: { '5': '>100%', '4.5': 'NA', '4': 'NA', '3.5': '100%', '3': '95%', '2': '90%', '1': '<90%' },
};

// Detailed breakdown for Productivity, which spans multiple raw measures
// (unlike the other metrics' single-threshold cells in SCORE_KEY above).
export const PRODUCTIVITY_SCALE = [
  { rating: '5', label: 'Exceptional', calls: '6+ sustained', attempts: '14+', contacts: '120+', cadence: '100%, zero backlog, absorbs overflow', documentation: 'Same-day, every time' },
  { rating: '4.5', label: 'Highly Effective', calls: '5 – 6', attempts: '12 – 14', contacts: '100 – 120', cadence: '100%, zero contact backlog', documentation: 'Same-day, no lag' },
  { rating: '4', label: 'Exceeds Expectations', calls: '4 – 5', attempts: '10 – 12', contacts: '80 – 100', cadence: '100% + proactive high-risk follow-up', documentation: 'Same-day, consistent' },
  { rating: '3.5', label: 'Meets Expectations (Standard)', calls: '3 – 4', attempts: '8 – 10', contacts: '60 – 80', cadence: '90 – 100%', documentation: 'Same-day, consistent' },
  { rating: '3', label: 'Approaching Expectations', calls: '2 – 3', attempts: '6 – 8', contacts: '45 – 60', cadence: '70 – 90%', documentation: 'Occasional lag beyond 24 hrs' },
  { rating: '2', label: 'Below Expectations', calls: '1.5 – 2', attempts: '4 – 6', contacts: '30 – 45', cadence: '50 – 70%', documentation: 'Regular lag beyond 24 hrs' },
  { rating: '1', label: 'Unacceptable', calls: '< 1.5', attempts: '< 4', contacts: '< 30', cadence: '< 50%', documentation: 'Frequent same-day lag' },
];

const BONUS_THRESHOLD = 3.5;

// Excludes NA metrics and renormalizes weights; returns null if incomplete or all-NA.
export function computeTotal(scores) {
  if (!scores) return null;
  let s = 0, w = 0;
  for (const m of METRICS) {
    const v = scores[m.key];
    if (v == null || v === '') return null; // incomplete
    if (v === 'NA') continue; // excluded from weighting
    if (isNaN(Number(v))) return null;
    s += Number(v) * m.weight;
    w += m.weight;
  }
  return w ? s / w : null; // all-NA -> null
}

// entries: map of "YYYY-MM" (zero-padded) -> { scores, total }, scoped to a single year.
export function monthlyTotal(entries, year, month) {
  const e = entries?.[entryId(year, month)];
  if (!e) return null;
  return e.total != null ? e.total : computeTotal(e.scores);
}

export function quarterAvg(entries, year, q) {
  const start = (q - 1) * 3 + 1;
  const arr = [];
  for (let mo = start; mo < start + 3; mo++) {
    const t = monthlyTotal(entries, year, mo);
    if (t != null) arr.push(t);
  }
  if (!arr.length) return { avg: null, count: 0 };
  return { avg: arr.reduce((a, b) => a + b, 0) / arr.length, count: arr.length };
}

export function annualAvg(entries, year) {
  const arr = [];
  for (let mo = 1; mo <= 12; mo++) {
    const t = monthlyTotal(entries, year, mo);
    if (t != null) arr.push(t);
  }
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function latestMonth(entries, year) {
  for (let mo = 12; mo >= 1; mo--) {
    const t = monthlyTotal(entries, year, mo);
    if (t != null) return { mo, total: t };
  }
  return null;
}

export function isBonusEligible(avg) {
  return avg != null && avg >= BONUS_THRESHOLD;
}

export function fmt(v) {
  return v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1);
}

export function rawFmt(v) {
  if (v == null || v === '') return '—';
  if (v === 'NA') return 'NA';
  return Number.isInteger(Number(v)) ? String(Number(v)) : String(v);
}

export function colorFor(v) {
  if (v == null) return '#98a09d';
  if (v >= 4.5) return '#0F6B3E';
  if (v >= 3.5) return '#0E5B57';
  if (v >= 3) return '#8A5A12';
  return '#A3331F';
}

export function badge(v) {
  if (v == null) return { bg: '#EDEAE1', fg: '#98a09d' };
  if (v >= 4.5) return { bg: '#E1F0E7', fg: '#0F6B3E' };
  if (v >= 3.5) return { bg: '#DCEBEA', fg: '#0E5B57' };
  if (v >= 3) return { bg: '#F5E9D2', fg: '#8A5A12' };
  return { bg: '#F6E0DA', fg: '#A3331F' };
}

export function pillStyle(v, big) {
  const b = badge(v);
  return {
    display: 'inline-block',
    padding: big ? '5px 12px' : '4px 10px',
    borderRadius: '8px',
    background: b.bg,
    color: b.fg,
    fontFamily: "'Space Grotesk'",
    fontWeight: 600,
    fontSize: big ? '15px' : '13.5px',
    minWidth: '44px',
    textAlign: 'center',
  };
}

export function initials(name) {
  return (name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_PALETTE = [
  ['#DCEBEA', '#0E5B57'],
  ['#F0E6D6', '#8A5A12'],
  ['#E7E1F0', '#5B4B8A'],
  ['#E1F0E7', '#0F6B3E'],
  ['#F5E0DA', '#A3331F'],
  ['#DEE9F2', '#2C5A8A'],
];

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarColors(id) {
  const h = hashStr(id) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[h];
}

export function entryId(year, month) {
  return year + '-' + String(month).padStart(2, '0');
}
