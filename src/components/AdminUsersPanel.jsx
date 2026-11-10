import { useState, useEffect } from 'react';
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
} from '../services/api';

function formatValidity(expiresAt, role) {
  if (role === 'admin' || !expiresAt) {
    return { text: '♾️ Unlimited', expired: false };
  }
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - Date.now();
  if (diffMs <= 0) {
    return { text: `Expired (${exp.toLocaleString()})`, expired: true };
  }
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hrs = totalHours % 24;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const rem = days > 0 ? `${days}d ${hrs}h left` : hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
  return {
    text: `⏱ ${rem} (till ${exp.toLocaleString()})`,
    expired: false,
  };
}

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessMode, setAccessMode] = useState('timed'); // 'timed' | 'unlimited'
  const [durationHours, setDurationHours] = useState(24);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 6000);
    return () => clearInterval(interval);
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await adminListUsers();
      if (data?.users) setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setCreating(true);
    try {
      await adminCreateUser({
        username: username.trim(),
        password,
        accessMode,
        durationHours: accessMode === 'timed' ? durationHours : null,
      });
      setSuccessMsg(
        `✅ User "${username.trim()}" created (${accessMode === 'unlimited' ? 'Unlimited' : `${durationHours} hours limit`})! Ab ye username/password unhe de sakte hain.`
      );
      setUsername('');
      setPassword('');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(u) {
    try {
      await adminUpdateUser(u.id, { isActive: !u.isActive });
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSetAccess(u, mode, hours = null) {
    try {
      await adminUpdateUser(u.id, {
        accessMode: mode,
        durationHours: hours,
        isActive: true,
      });
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleResetPassword(u) {
    const newPass = window.prompt(`Enter new password for "${u.username}" (min 4 chars):`);
    if (!newPass || newPass.trim().length < 4) return;
    try {
      await adminUpdateUser(u.id, { password: newPass.trim() });
      alert(`Password updated for "${u.username}"!`);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete user "${u.username}"? Unka WhatsApp disconnect aur sara data delete ho jayega.`)) {
      return;
    }
    try {
      await adminDeleteUser(u.id);
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  const presets = [
    { label: '1 Hour', hours: 1 },
    { label: '6 Hours', hours: 6 },
    { label: '1 Day (24h)', hours: 24 },
    { label: '3 Days', hours: 72 },
    { label: '7 Days', hours: 168 },
    { label: '30 Days', hours: 720 },
  ];

  return (
    <div className="space-y-6">
      {/* Create Sub-User Card */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm">
                👑
              </span>
              Create User Login (Time Limit ya Unlimited)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Naya username & password banakar dusre logon ko dein — har user ko apna alag private dashboard milega aur time khatam hote hi automatically lock & disconnect ho jayega.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                New Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. client_rohit"
                minLength={3}
                maxLength={32}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                New Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                minLength={4}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Access Validity Plan
            </label>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold">
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === 'timed'}
                  onChange={() => setAccessMode('timed')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>⏱ Time Limit</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold">
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === 'unlimited'}
                  onChange={() => setAccessMode('unlimited')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>♾️ Unlimited (Never Expires)</span>
              </label>
            </div>

            {accessMode === 'timed' && (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.hours}
                      type="button"
                      onClick={() => setDurationHours(p.hours)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        Number(durationHours) === p.hours
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Custom Hours:</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                    className="w-28 px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
                  />
                  <span className="text-[11px] text-slate-400">
                    (Expires: {new Date(Date.now() + durationHours * 3600000).toLocaleString()})
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl font-bold text-xs transition shadow-sm"
          >
            {creating ? 'Creating User...' : '✨ Create User Account'}
          </button>
        </form>
      </div>

      {/* Users Management List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900">
            👥 Registered Users ({users.length})
          </h3>
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            {loading ? 'Refreshing...' : '↻ Refresh List'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">WhatsApp Linked</th>
                <th className="py-2.5 px-3">Validity / Expiry</th>
                <th className="py-2.5 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => {
                const validity = formatValidity(u.expiresAt, u.role);
                const isAdminRow = u.role === 'admin';
                const statusBadge = isAdminRow
                  ? 'bg-amber-100 text-amber-800'
                  : !u.isActive
                  ? 'bg-slate-200 text-slate-700'
                  : validity.expired
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700';
                const statusText = isAdminRow
                  ? '👑 Admin'
                  : !u.isActive
                  ? '⏸ Disabled'
                  : validity.expired
                  ? '⛔ Expired'
                  : '🟢 Active';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.username}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {u.accounts?.length > 0
                        ? u.accounts.map((a) => (
                            <div key={a.id} className="text-[11px]">
                              {a.connected ? `🟢 +${a.phone || a.name}` : `⚪ ${a.name} (Offline)`}
                            </div>
                          ))
                        : 'No account'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 font-medium">
                      {validity.text}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isAdminRow ? (
                        <span className="text-[11px] text-slate-400 italic">Controlled via Server ENV</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'timed', 24)}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                            title="Give 24h from now"
                          >
                            +24h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'timed', 168)}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                            title="Give 7 days from now"
                          >
                            +7d
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'unlimited')}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px]"
                            title="Switch to Unlimited access"
                          >
                            ♾️ Unlimited
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            🔑 Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px]"
                          >
                            {u.isActive ? '⏸ Disable' : '▶ Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px]"
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
