import { useState, useEffect } from 'react';
import {
  getAccounts,
  createAccount,
  deleteAccount,
  getActiveAccountId,
  setActiveAccountId,
} from '../services/api';

export default function AccountSwitcher({ onAccountChange }) {
  const [accounts, setAccounts] = useState([]);
  const [activeId, setActiveId] = useState(getActiveAccountId());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
    const interval = setInterval(loadAccounts, 4000);
    return () => clearInterval(interval);
  }, []);

  async function loadAccounts() {
    try {
      const data = await getAccounts();
      if (data && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !data.accounts.some((a) => a.id === activeId)) {
          handleSwitch(data.accounts[0].id);
        }
      }
    } catch (err) {
      // ignore poll error
    }
  }

  function handleSwitch(id) {
    setActiveId(id);
    setActiveAccountId(id);
    if (onAccountChange) {
      onAccountChange(id);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setLoading(true);
    try {
      const res = await createAccount(newAccountName.trim());
      if (res.success && res.account) {
        setNewAccountName('');
        setShowAddModal(false);
        await loadAccounts();
        handleSwitch(res.account.id);
      }
    } catch (err) {
      alert('Failed to add account: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (accounts.length <= 1) {
      alert('Your last remaining WhatsApp workspace cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${name}"? Its session and history will be cleared.`)) {
      try {
        await deleteAccount(id);
        const data = await getAccounts();
        const updatedList = data?.accounts || [];
        setAccounts(updatedList);
        if (activeId === id && updatedList.length > 0) {
          handleSwitch(updatedList[0].id);
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  }

  const activeAccount = accounts.find((a) => a.id === activeId) || accounts[0] || {
    id: activeId,
    name: 'My WhatsApp',
    isReady: false,
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Account Selector Dropdown */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                activeAccount.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            Account:
          </span>

          <select
            value={activeId}
            onChange={(e) => handleSwitch(e.target.value)}
            className="bg-white border-0 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-0 focus:outline-none cursor-pointer shadow-sm hover:bg-slate-50"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} {acc.phone ? `(+${acc.phone})` : ''} — {acc.isReady ? '🟢 Connected' : (acc.qrCode ? '🟡 Scan QR' : '⚪ Offline')}
              </option>
            ))}
          </select>

          {accounts.length > 1 && (
            <button
              onClick={() => handleDelete(activeId, activeAccount.name)}
              className="text-slate-400 hover:text-red-500 text-xs px-2 py-1 transition"
              title="Delete this account"
            >
              ✕
            </button>
          )}
        </div>

        {/* Add Account Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
        >
          <span>＋</span> Add WhatsApp
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📱</span> Add New WhatsApp Account
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter a label for this WhatsApp account (e.g. "Sales Bot", "Support", "Marketing"). You can then scan its QR code to connect.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Name / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Team #2"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newAccountName.trim()}
                  className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl shadow-sm transition"
                >
                  {loading ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

