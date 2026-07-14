'use client';

import { useMemo, useState } from 'react';
import { useAuth, signOutUser } from '@/lib/useAuth';
import { useManagers, useNurses, useEntriesByYear } from '@/lib/data';
import SignInScreen from '@/components/SignInScreen';
import Header from '@/components/Header';
import RosterView from '@/components/RosterView';
import EntryView from '@/components/EntryView';
import NurseDashboardView from '@/components/NurseDashboardView';
import BonusReportView from '@/components/BonusReportView';

export default function Page() {
  const { user, loading, profileReady, profileError } = useAuth();

  if (loading) return <FullScreenMessage text="Loading…" />;
  if (!user) return <SignInScreen />;
  if (profileError) {
    return (
      <FullScreenMessage text={`Could not set up your account: ${profileError}`}>
        <button
          onClick={signOutUser}
          style={{ marginTop: '16px', background: '#0E5B57', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Sign out and try again
        </button>
      </FullScreenMessage>
    );
  }
  if (!profileReady) return <FullScreenMessage text="Setting up your account…" />;

  return <App uid={user.uid} />;
}

function App({ uid }) {
  const managers = useManagers();
  const { nurses, loaded: nursesLoaded } = useNurses();
  const entriesByNurse = useEntriesByYear();

  const [view, setView] = useState('roster');
  const [managerId, setManagerId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [bonusQuarter, setBonusQuarter] = useState('2');

  const managerName = (id) => managers.find((m) => m.id === id)?.name || '—';
  const scopeLabel = managerId === 'all' ? 'All managers' : managerName(managerId);
  const scopeNurses = useMemo(
    () => nurses.filter((n) => managerId === 'all' || n.managerId === managerId),
    [nurses, managerId]
  );

  const openNurse = (id) => { setSelectedNurseId(id); setView('nurse'); };
  const selectedNurse = nurses.find((n) => n.id === selectedNurseId);

  if (!nursesLoaded) return <FullScreenMessage text="Loading roster…" />;

  return (
    <div>
      <Header managers={managers} managerId={managerId} onManagerChange={setManagerId} view={view} onNavigate={setView} />
      <main style={{ maxWidth: '1220px', margin: '0 auto', padding: '30px 28px 70px' }}>
        {view === 'roster' && (
          <RosterView
            nurses={scopeNurses}
            managers={managers}
            entriesByNurse={entriesByNurse}
            managerName={managerName}
            scopeLabel={scopeLabel}
            search={search}
            onSearchChange={setSearch}
            onOpenNurse={openNurse}
            onGoEntry={() => setView('entry')}
            currentManagerId={uid}
            managerFilterId={managerId}
          />
        )}

        {view === 'entry' && (
          <EntryView
            nurses={scopeNurses.length ? scopeNurses : nurses}
            entriesByNurse={entriesByNurse}
            uid={uid}
            initialNurseId={selectedNurseId}
          />
        )}

        {view === 'nurse' && selectedNurse && (
          <NurseDashboardView
            nurse={selectedNurse}
            nurses={scopeNurses.length ? scopeNurses : nurses}
            entries={entriesByNurse[selectedNurse.id] || {}}
            managerName={managerName}
            onBack={() => setView('roster')}
            onSwitchNurse={(id) => setSelectedNurseId(id)}
          />
        )}
        {view === 'nurse' && !selectedNurse && (
          <p style={{ color: '#6b7674' }}>Select a nurse from the roster.</p>
        )}

        {view === 'bonus' && (
          <BonusReportView
            nurses={scopeNurses}
            entriesByNurse={entriesByNurse}
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
