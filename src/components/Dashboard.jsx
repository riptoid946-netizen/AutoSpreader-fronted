import { useState, useEffect } from 'react';
import {
  getStats,
  getActiveAccountId,
  setActiveAccountId,
  getAuthToken,
  getStoredUser,
  getMe,
  logoutUser,
} from '../services/api';
import AuthScreen from './AuthScreen';
import AdminUsersPanel from './AdminUsersPanel';
import ConnectionSection from './ConnectionSection';
import AutomationSettings from './AutomationSettings';
import Mode2BulkSender from './Mode2BulkSender';
import Mode3Broadcast from './Mode3Broadcast';
import MessagesList from './MessagesList';
import ActivityLogs from './ActivityLogs';
import AccountSwitcher from './AccountSwitcher';

export default function Dashboard() {
  const [user, setUser] = useState(() => (getAuthToken() ? getStoredUser() : null));
  const [authChecked, setAuthChecked] = useState(!getAuthToken());
  const [activeTab, setActiveTab] = useState('mode1'); // 'mode1', 'mode2', 'mode3'
  const [stats, setStats] = useState({ totalReplied: 0, totalSuccessful: 0, totalFailed: 0, totalIncoming: 0 });
  const [activeAccount, setActiveAccount] = useState(getActiveAccountId());
  const [refreshKey, setRefreshKey] = useState(0);

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

  const fetchStats = async () => {
    if (!user) return;
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      // handled gracefully
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [activeAccount, user]);

  const handleAccountChange = (id) => {
    setActiveAccount(id);
    setRefreshKey((k) => k + 1);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
        Loading workspace...
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
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with User Info, Account Switcher & Logout */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>⚡ WhatsApp Multi-User Automation</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Private Workspace • Auto-Reply • Targeted Bulk • Contact Broadcast • Media & Voice Notes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl">
              <span>👤</span>
              <span>{user.username}</span>
              {user.role === 'admin' ? (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                  {user.expiresAt ? `⏱ Till ${new Date(user.expiresAt).toLocaleDateString()}` : '♾️ Unlimited'}
                </span>
              )}
            </span>

            <AccountSwitcher onAccountChange={handleAccountChange} />

            <button
              onClick={logoutUser}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
              title="Logout from this dashboard"
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Global Stat Cards for Selected Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Active Account"
            value={<span className="text-indigo-600 text-lg font-bold">{activeAccount}</span>}
            subtitle="Selected WhatsApp Profile"
          />
          <StatCard
            title="Incoming Messages"
            value={stats.totalIncoming ?? 0}
            subtitle="Saved in Database"
            className="border-blue-200 bg-blue-50/40"
          />
          <StatCard
            title="Total Messages Sent"
            value={stats.totalSuccessful ?? 0}
            subtitle={`${stats.totalReplied ?? 0} unique contacts`}
            className="border-emerald-200 bg-emerald-50/40"
          />
          <StatCard
            title="Failed Deliveries"
            value={stats.totalFailed ?? 0}
            subtitle="Auto-retry capable"
            className="border-red-200 bg-red-50/40"
          />
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveTab('mode1')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
              activeTab === 'mode1'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>💬 Mode 1: Auto-Reply</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">Incoming</span>
          </button>

          <button
            onClick={() => setActiveTab('mode2')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
              activeTab === 'mode2'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🚀 Mode 2: Targeted Bulk</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">Custom Numbers</span>
          </button>

          <button
            onClick={() => setActiveTab('mode3')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
              activeTab === 'mode3'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>📢 Mode 3: Broadcast All</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">All WhatsApp Chats</span>
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/80'
              }`}
            >
              <span>👑 Admin Panel</span>
              <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded">Create Users</span>
            </button>
          )}
        </div>

        {/* Admin User Management View (Exclusive to Admin) */}
        {activeTab === 'admin' && user.role === 'admin' ? (
          <AdminUsersPanel />
        ) : (
          /* Main Content Grid (reloads automatically when account switches) */
          <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: WhatsApp Connection + Active Mode Control */}
            <div className="lg:col-span-5 space-y-6">
              <ConnectionSection />

              {activeTab === 'mode1' && <AutomationSettings />}
              {activeTab === 'mode2' && <Mode2BulkSender />}
              {activeTab === 'mode3' && <Mode3Broadcast />}
            </div>

            {/* Right Column: Live Messages Inbox + Activity Logs */}
            <div className="lg:col-span-7 space-y-6">
              <MessagesList />
              <ActivityLogs />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${className}`}>
      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-900">{value}</span>
      </div>
      <p className="text-slate-500 text-xs mt-1 font-medium">{subtitle}</p>
    </div>
  );
}
