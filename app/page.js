'use client';

import { useMemo, useState } from 'react';
import { useAuth, signOutUser } from '@/lib/useAuth';
import { useManagers, useNurses, useEntriesByYear } from '@/lib/data';
import { DEFAULT_YEAR } from '@/lib/scoring';
import SignInScreen from '@/components/SignInScreen';
import Header from '@/components/Header';
import RosterView from '@/components/RosterView';
import EntryView from '@/components/EntryView';
import NurseDashboardView from '@/components/NurseDashboardView';
import BonusReportView from '@/components/BonusReportView';

export default function Page() {
  const { user, loading, profileReady, profileError, retryProfileSetup } = useAuth();

  if (loading) return <FullScreenMessage text="Loading…" />;
  if (!user) return <SignInScreen />;
  if (profileError) {
    return (
      <FullScreenMessage text={`Could not set up your account: ${profileError}`}>
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={retryProfileSetup}
            style={{ background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
          <button
            onClick={signOutUser}
            style={{ background: 'transparent', color: '#6b7674', border: '1.5px solid #ded7c8', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </FullScreenMessage>
    );
  }
  if (!profileReady) return <FullScreenMessage text="Setting up your account… (this can take up to 20 seconds on a slow connection)" />;

  return <App uid={user.uid} />;
}

function App({ uid }) {
  const managers = useManagers();
  const { nurses, loaded: nursesLoaded, error: nursesError } = useNurses();
  const [year, setYear] = useState(DEFAULT_YEAR);
  const nurseIds = useMemo(() => nurses.map((n) => n.id), [nurses]);
  const { entriesByNurse, error: entriesError } = useEntriesByYear(nurseIds, year);

  const [view, setView] = useState('roster');
  const [managerId, setManagerId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [bonusQuarter, setBonusQuarter] = useState('2');
  const [entryMonth, setEntryMonth] = useState(null);

  const managerName = (id) => managers.find((m) => m.id === id)?.name || '—';
  const scopeLabel = managerId === 'all' ? 'All managers' : managerName(managerId);
  const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  const nursesSorted = useMemo(() => [...nurses].sort(byName), [nurses]);
  const scopeNurses = useMemo(
    () => nurses.filter((n) => managerId === 'all' || n.managerId === managerId).sort(byName),
    [nurses, managerId]
  );

  const openNurse = (id) => { setSelectedNurseId(id); setView('nurse'); };
  const selectedNurse = nurses.find((n) => n.id === selectedNurseId);

  // Plain entry point: no specific month pre-selected (defaults to current month).
  const goEntry = () => { setEntryMonth(null); setView('entry'); };
  // From a nurse's monthly breakdown: jump straight to that nurse+month, pre-filled.
  const editMonth = (nurseId, mo) => { setSelectedNurseId(nurseId); setEntryMonth(mo); setView('entry'); };
  const onNavigate = (v) => { if (v === 'entry') goEntry(); else setView(v); };

  if (!nursesLoaded) return <FullScreenMessage text="Loading roster…" />;

  return (
    <div>
      <Header managers={managers} managerId={managerId} onManagerChange={setManagerId} view={view} onNavigate={onNavigate} year={year} onYearChange={setYear} />
      <main style={{ maxWidth: '1220px', margin: '0 auto', padding: '30px 28px 70px' }}>
        {(nursesError || entriesError) && (
          <div style={{ background: '#F6E0DA', color: '#A3331F', border: '1px solid #e0b3a6', borderRadius: '10px', padding: '12px 16px', fontSize: '13.5px', fontWeight: 600, marginBottom: '20px' }}>
            {nursesError && <div>Nurses: {nursesError}</div>}
            {entriesError && <div>Scores: {entriesError}</div>}
          </div>
        )}
        {view === 'roster' && (
          <RosterView
            nurses={scopeNurses}
            managers={managers}
            entriesByNurse={entriesByNurse}
            year={year}
            managerName={managerName}
            scopeLabel={scopeLabel}
            search={search}
            onSearchChange={setSearch}
            onOpenNurse={openNurse}
            onGoEntry={goEntry}
            currentManagerId={uid}
            managerFilterId={managerId}
          />
        )}

        {view === 'entry' && (
          <EntryView
            nurses={scopeNurses.length ? scopeNurses : nursesSorted}
            entriesByNurse={entriesByNurse}
            year={year}
            uid={uid}
            initialNurseId={selectedNurseId}
            initialMonth={entryMonth}
          />
        )}

        {view === 'nurse' && selectedNurse && (
          <NurseDashboardView
            nurse={selectedNurse}
            nurses={scopeNurses.length ? scopeNurses : nursesSorted}
            entries={entriesByNurse[selectedNurse.id] || {}}
            year={year}
            managerName={managerName}
            onBack={() => setView('roster')}
            onSwitchNurse={(id) => setSelectedNurseId(id)}
            onEditMonth={editMonth}
          />
        )}
        {view === 'nurse' && !selectedNurse && (
          <p style={{ color: '#6b7674' }}>Select a nurse from the roster.</p>
        )}

        {view === 'bonus' && (
          <BonusReportView
            nurses={scopeNurses}
            entriesByNurse={entriesByNurse}
            year={year}
            scopeLabel={scopeLabel}
            bonusQuarter={bonusQuarter}
            onQuarterChange={setBonusQuarter}
            managerName={managerName}
          />
        )}
      </main>
    </div>
  );
}

function FullScreenMessage({ text, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F1EA', color: '#6b7674', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
      <div>{text}</div>
      {children}
    </div>
  );
}
