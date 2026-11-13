import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  getDashboardSnapshot,
  getActiveAccountId,
  setActiveAccountId,
  getAuthToken,
  getStoredUser,
  getMe,
  logoutUser,
} from '../services/api';
import { smartPoll } from '../services/smartPoll';
import AuthScreen from './AuthScreen';
import ConnectionSection from './ConnectionSection';
import AutomationSettings from './AutomationSettings';
import Mode2BulkSender from './Mode2BulkSender';
import Mode3Broadcast from './Mode3Broadcast';
import MessagesList from './MessagesList';
import ActivityLogs from './ActivityLogs';
import AccountSwitcher from './AccountSwitcher';
import BrandLogo from './BrandLogo';

// Admin panel loads only when an admin actually opens that tab (smaller main bundle)
const AdminUsersPanel = lazy(() => import('./AdminUsersPanel'));

export default function Dashboard() {
  const [user, setUser] = useState(() => (getAuthToken() ? getStoredUser() : null));
  const [authChecked, setAuthChecked] = useState(!getAuthToken());
  const [activeTab, setActiveTab] = useState('mode1'); // 'mode1', 'mode2', 'mode3'
  const [snap, setSnap] = useState(null);
  const [activeAccount, setActiveAccount] = useState(getActiveAccountId());
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Stats derived from the snapshot (no separate polling loop anymore)
  const stats = snap?.stats ?? { totalReplied: 0, totalSuccessful: 0, totalFailed: 0, totalIncoming: 0 };

  // Leaving mobile width → close menu & restore scroll
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  // While menu is open: lock background scroll, close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onAuthChanged = (e) => {
      setUser(e.detail);
      setActiveAccount(getActiveAccountId());
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('wa-auth-changed', onAuthChanged);

    if (getAuthToken()) {
      getMe()
        .then((res) => {
          setUser(res.user);
          if (res.accounts?.length > 0) {
            const current = getActiveAccountId();
            const stillOwned = res.accounts.some((a) => a.id === current);
            if (!stillOwned) {
              setActiveAccountId(res.accounts[0].id);
              setActiveAccount(res.accounts[0].id);
            }
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }

    return () => window.removeEventListener('wa-auth-changed', onAuthChanged);
  }, []);

  // ONE snapshot poll (4s, tab-hidden aware) replaces the old stats/messages/logs/
  // accounts loops. 304 (nothing changed) → data is null → keep previous state.
  const loadSnapshot = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getDashboardSnapshot();
      if (data) setSnap(data);
    } catch (err) {
      // handled gracefully
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return smartPoll(loadSnapshot, 4000);
  }, [user, activeAccount, refreshKey]);

  const handleAccountChange = (id) => {
    setActiveAccount(id);
    setRefreshKey((k) => k + 1);
  };

  // Close menu → optionally switch tab → scroll to target section
  const navigateMenu = ({ id, tab } = {}) => {
    setMenuOpen(false);
    if (tab) setActiveTab(tab);
    window.setTimeout(
      () => {
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      tab ? 150 : 0
    );
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner !h-7 !w-7" />
        <p className="text-xs text-zinc-400">Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(data) => {
          setUser(data.user);
          setActiveAccount(data.defaultAccountId || getActiveAccountId());
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2.5 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto">
        {/* Header — mobile: hamburger + brand; desktop: full controls */}
        <header className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="btn-outline shrink-0 !px-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <BrandLogo size={36} />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-zinc-100 leading-tight sm:text-base">
                WhatsApp Multi-User Automation
              </h1>
              <p className="mt-0.5 hidden truncate text-xs text-zinc-400 sm:block">
                Private Workspace • Auto-Reply • Targeted Bulk • Contact Broadcast • Media &amp; Voice Notes
              </p>
            </div>
          </div>

          {!isMobile && (
            <div className="flex flex-wrap items-center gap-2">
            {snap?.bulk?.running && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/40 bg-emerald-700/15 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
                <span className="status-dot bg-emerald-400 animate-pulse" />
                Bulk running {snap.bulk.progressPercentage ?? 0}%
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300">
              <span className="font-medium">{user.username}</span>
              {user.role === 'admin' ? (
                <span className="rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                  Admin
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400">
                  {user.expiresAt ? `Till ${new Date(user.expiresAt).toLocaleDateString()}` : 'Unlimited'}
                </span>
              )}
            </span>

            <AccountSwitcher onAccountChange={handleAccountChange} accounts={snap?.accounts} onRefresh={loadSnapshot} />

            <button
              onClick={logoutUser}
              className="btn-danger-outline"
              title="Logout from this dashboard"
            >
              Log out
            </button>
            </div>
          )}
        </header>

        {/* Mobile slide-in menu — account, QR/connection, settings, logout */}
        {isMobile && menuOpen && (
          <div className="fixed inset-0 z-50" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
            <div
              className="absolute inset-0 bg-zinc-950/80 animate-fade-in"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col border-r border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <BrandLogo size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">{user.username}</p>
                    <p className="text-[11px] text-zinc-400">
                      {user.role === 'admin'
                        ? 'Administrator'
                        : user.expiresAt
                        ? `Till ${new Date(user.expiresAt).toLocaleDateString()}`
                        : 'Unlimited access'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="btn-outline shrink-0 !px-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <div>
                  <p className="label">WhatsApp Account</p>
                  <AccountSwitcher onAccountChange={handleAccountChange} accounts={snap?.accounts} onRefresh={loadSnapshot} />
                </div>

                <div>
                  <p className="label">Modes</p>
                  <div className="space-y-1.5">
                    <MenuLink
                      label="Mode 1: Auto-Reply"
                      active={activeTab === 'mode1'}
                      onClick={() => navigateMenu({ tab: 'mode1', id: 'mode1-heading' })}
                    />
                    <MenuLink
                      label="Mode 2: Targeted Bulk"
                      active={activeTab === 'mode2'}
                      onClick={() => navigateMenu({ tab: 'mode2', id: 'mode2-heading' })}
                    />
                    <MenuLink
                      label="Mode 3: Broadcast All"
                      active={activeTab === 'mode3'}
                      onClick={() => navigateMenu({ tab: 'mode3', id: 'mode3-heading' })}
                    />
                    {user.role === 'admin' && (
                      <MenuLink
                        label="Admin Panel"
                        active={activeTab === 'admin'}
                        onClick={() => navigateMenu({ tab: 'admin' })}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <p className="label">Quick actions</p>
                  <div className="space-y-1.5">
                    <MenuLink
                      label="WhatsApp Connection / QR"
                      onClick={() => navigateMenu({ id: 'connection-heading' })}
                    />
                    <MenuLink
                      label="Saved Messages & Inquiries"
                      onClick={() => navigateMenu({ id: 'messages-heading' })}
                    />
                    <MenuLink
                      label="Activity Logs"
                      onClick={() => navigateMenu({ id: 'logs-heading' })}
                    />
                  </div>
                </div>

                <button onClick={logoutUser} className="btn-danger-outline w-full">
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Stat Cards for Selected Account */}
        <main id="main-content" className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
        <section aria-label="Account statistics" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard
            title="Active Account"
            value={<span className="text-zinc-100">{activeAccount}</span>}
            subtitle="Selected WhatsApp profile"
          />
          <StatCard
            title="Incoming Messages"
            value={stats.totalIncoming ?? 0}
            subtitle="Saved in database"
          />
          <StatCard
            title="Total Messages Sent"
            value={stats.totalSuccessful ?? 0}
            subtitle={`${stats.totalReplied ?? 0} unique contacts`}
          />
          <StatCard
            title="Failed Deliveries"
            value={
              <span className={(stats.totalFailed ?? 0) > 0 ? 'text-red-400' : 'text-zinc-100'}>
                {stats.totalFailed ?? 0}
              </span>
            }
            subtitle="Auto-retry capable"
          />
        </section>

        {/* Mode Selector Tabs — desktop only (≥768px). On phone the modes live inside the hamburger drawer. */}
        <div
          role="tablist"
          aria-label="Automation modes"
          className="hidden md:flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1"
        >
          <button
            role="tab"
            id="tab-mode1"
            aria-selected={activeTab === 'mode1'}
            aria-controls="mode-panel"
            tabIndex={activeTab === 'mode1' ? 0 : -1}
            onClick={() => setActiveTab('mode1')}
            className={`mode-tab ${activeTab === 'mode1' ? 'bg-emerald-700 text-white' : 'mode-tab-idle'}`}
          >
            <span>Mode 1: Auto-Reply</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                activeTab === 'mode1' ? 'bg-white/15 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Incoming
            </span>
          </button>

          <button
            role="tab"
            id="tab-mode2"
            aria-selected={activeTab === 'mode2'}
            aria-controls="mode-panel"
            tabIndex={activeTab === 'mode2' ? 0 : -1}
            onClick={() => setActiveTab('mode2')}
            className={`mode-tab ${activeTab === 'mode2' ? 'bg-emerald-700 text-white' : 'mode-tab-idle'}`}
          >
            <span>Mode 2: Targeted Bulk</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                activeTab === 'mode2' ? 'bg-white/15 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              Custom Numbers
            </span>
          </button>

          <button
            role="tab"
            id="tab-mode3"
            aria-selected={activeTab === 'mode3'}
            aria-controls="mode-panel"
            tabIndex={activeTab === 'mode3' ? 0 : -1}
            onClick={() => setActiveTab('mode3')}
            className={`mode-tab ${activeTab === 'mode3' ? 'bg-emerald-700 text-white' : 'mode-tab-idle'}`}
          >
            <span>Mode 3: Broadcast All</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                activeTab === 'mode3' ? 'bg-white/15 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              All WhatsApp Chats
            </span>
          </button>

          {user.role === 'admin' && (
            <button
              role="tab"
              id="tab-admin"
              aria-selected={activeTab === 'admin'}
              aria-controls="mode-panel"
              tabIndex={activeTab === 'admin' ? 0 : -1}
              onClick={() => setActiveTab('admin')}
              className={`mode-tab ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-amber-400/90 hover:bg-zinc-800 hover:text-amber-300'
              }`}
            >
              <span>Admin Panel</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  activeTab === 'admin' ? 'bg-zinc-950/20 text-zinc-950/80' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Create Users
              </span>
            </button>
          )}
        </div>

        {/* Admin User Management View (Exclusive to Admin) */}
        <div role="tabpanel" id="mode-panel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'admin' && user.role === 'admin' ? (
            <Suspense
              fallback={
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-xs text-zinc-400">
                  Loading admin panel…
                </div>
              }
            >
              <AdminUsersPanel />
            </Suspense>
          ) : (
            /* Main Content Grid (reloads automatically when account switches) */
            <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: WhatsApp Connection + Active Mode Control */}
              <div className="lg:col-span-5 space-y-5">
                <ConnectionSection />

                {activeTab === 'mode1' && <AutomationSettings />}
                {activeTab === 'mode2' && <Mode2BulkSender />}
                {activeTab === 'mode3' && <Mode3Broadcast />}
              </div>

              {/* Right Column: Live Messages Inbox + Activity Logs */}
              <div className="lg:col-span-7 space-y-5">
                <MessagesList messages={snap?.messages} onRefresh={loadSnapshot} />
                <ActivityLogs logs={snap?.logs} />
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 sm:p-4">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      <div className="mt-1.5 break-words text-xl font-semibold text-zinc-100 tabular-nums tracking-tight sm:text-2xl">
        {value}
      </div>
      <p className="mt-1 text-[11px] text-zinc-400">{subtitle}</p>
    </div>
  );
}

function MenuLink({ label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-3 text-left text-xs font-medium transition-colors ${
        active
          ? 'border-emerald-700/60 bg-emerald-700/10 text-emerald-200'
          : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <svg
        className="h-3.5 w-3.5 shrink-0 text-zinc-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
