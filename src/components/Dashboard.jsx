import { useState, useEffect } from 'react';
import { getStats, getActiveAccountId } from '../services/api';
import ConnectionSection from './ConnectionSection';
import AutomationSettings from './AutomationSettings';
import Mode2BulkSender from './Mode2BulkSender';
import Mode3Broadcast from './Mode3Broadcast';
import MessagesList from './MessagesList';
import ActivityLogs from './ActivityLogs';
import AccountSwitcher from './AccountSwitcher';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('mode1'); // 'mode1', 'mode2', 'mode3'
  const [stats, setStats] = useState({ totalReplied: 0, totalSuccessful: 0, totalFailed: 0, totalIncoming: 0 });
  const [activeAccount, setActiveAccount] = useState(getActiveAccountId());
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [activeAccount]);

  const handleAccountChange = (id) => {
    setActiveAccount(id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Account Switcher */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>⚡ WhatsApp Multi-User Automation</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Multi-Account • Auto-Reply • Targeted Bulk • Contact Broadcast • Media & Voice Notes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AccountSwitcher onAccountChange={handleAccountChange} />
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
        </div>

        {/* Main Content Grid (reloads automatically when account switches) */}
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
