import { useState, useEffect } from 'react';
import {
  createAccount,
  deleteAccount,
  getActiveAccountId,
  setActiveAccountId,
} from '../services/api';

// Props-driven: accounts arrive from the dashboard snapshot poll (Dashboard.jsx),
// so this component runs no polling loop of its own. onRefresh re-pulls the
// snapshot after a mutation (create/delete account).
export default function AccountSwitcher({ onAccountChange, accounts: accountsProp, onRefresh }) {
  const [accounts, setAccounts] = useState(Array.isArray(accountsProp) ? accountsProp : []);
  const [activeId, setActiveId] = useState(getActiveAccountId());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onAccountChanged = (e) => {
      if (e.detail) setActiveId(e.detail);
    };
    window.addEventListener('wa-account-changed', onAccountChanged);
    return () => {
      window.removeEventListener('wa-account-changed', onAccountChanged);
    };
  }, []);

  // Snapshot data lands here — same auto-switch guard as before
  useEffect(() => {
    if (!Array.isArray(accountsProp)) return;
    setAccounts(accountsProp);
    const currentId = getActiveAccountId();
    setActiveId((prev) => (prev === currentId ? prev : currentId));
    if (accountsProp.length > 0 && !accountsProp.some((a) => a.id === currentId)) {
      handleSwitch(accountsProp[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsProp]);

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
        if (onRefresh) await onRefresh();
        handleSwitch(res.account.id);
      }
    } catch (err) {
      alert('Failed to add account: ' + err.message);
      if (onRefresh) onRefresh();
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
      const remaining = accounts.filter((a) => a.id !== id);
      try {
        await deleteAccount(id);
        if (onRefresh) await onRefresh();
        if (activeId === id && remaining.length > 0) {
          handleSwitch(remaining[0].id);
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
        if (onRefresh) onRefresh();
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
      <div className="flex flex-wrap items-center gap-2">
        {/* Account Selector Dropdown */}
        <div className="flex min-w-0 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <span className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-zinc-400">
            <span
              className={`status-dot ${activeAccount.isReady ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}
            />
            Account
          </span>

          <select
            value={activeId}
            onChange={(e) => handleSwitch(e.target.value)}
            aria-label="Select WhatsApp account"
            className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 max-w-[46vw] sm:max-w-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} {acc.phone ? `(+${acc.phone})` : ''} — {acc.isReady ? 'Connected' : (acc.authenticating ? 'Syncing…' : (acc.qrCode ? 'Scan QR' : (acc.initializing ? 'Starting…' : 'Offline')))}
              </option>
            ))}
          </select>

          {accounts.length > 1 && (
            <button
              onClick={() => handleDelete(activeId, activeAccount.name)}
              aria-label="Delete this account"
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-red-400"
              title="Delete this account"
            >
              ✕
            </button>
          )}
        </div>

        {/* Add Account Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-outline"
        >
          + Add WhatsApp
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 animate-fade-in">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 animate-scale-in">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Add New WhatsApp Account</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                Enter a label for this WhatsApp account (e.g. "Sales Bot", "Support", "Marketing"). You can then scan its QR code to connect.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label">Account name / label</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Team #2"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  autoFocus
                  required
                  className="field-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newAccountName.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Adding…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
