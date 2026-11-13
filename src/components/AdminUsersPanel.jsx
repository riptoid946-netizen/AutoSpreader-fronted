import { useState, useEffect } from 'react';
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
} from '../services/api';
import { smartPoll } from '../services/smartPoll';

function formatValidity(expiresAt, role) {
  if (role === 'admin' || !expiresAt) {
    return { text: 'Unlimited', expired: false };
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
    text: `${rem} (till ${exp.toLocaleString()})`,
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
    return smartPoll(loadUsers, 6000);
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
        `User "${username.trim()}" created (${accessMode === 'unlimited' ? 'Unlimited' : `${durationHours} hours limit`}) — ab ye username/password unhe de sakte hain.`
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
    <div className="space-y-5">
      {/* Create Sub-User Card */}
      <section className="panel" aria-labelledby="create-user-heading">
        <div className="mb-4">
          <h2 id="create-user-heading" className="panel-title">Create User Login (Time Limit ya Unlimited)</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Naya username &amp; password banakar dusre logon ko dein — har user ko apna alag private dashboard milega aur time khatam hote hi automatically lock &amp; disconnect ho jayega.
          </p>
        </div>

        {error && (
          <div className="banner banner-rose mb-4">
            <span className="font-medium">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="banner banner-emerald mb-4">
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. client_rohit"
                minLength={3}
                maxLength={32}
                required
                className="field"
              />
            </div>

            <div>
              <label className="label">New password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                minLength={4}
                required
                className="field"
              />
            </div>
          </div>

          <div className="panel-soft space-y-3">
            <label className="label mb-0">Access validity plan</label>

            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600">
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === 'timed'}
                  onChange={() => setAccessMode('timed')}
                  className="text-emerald-600"
                />
                <span>Time Limit</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600">
                <input
                  type="radio"
                  name="accessMode"
                  checked={accessMode === 'unlimited'}
                  onChange={() => setAccessMode('unlimited')}
                  className="text-emerald-600"
                />
                <span>Unlimited (Never Expires)</span>
              </label>
            </div>

            {accessMode === 'timed' && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.hours}
                      type="button"
                      onClick={() => setDurationHours(p.hours)}
                      className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        Number(durationHours) === p.hours
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">Custom hours:</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                    className="w-28 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                  <span className="text-[11px] text-zinc-400">
                    (Expires: {new Date(Date.now() + durationHours * 3600000).toLocaleString()})
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-amber"
          >
            {creating ? 'Creating User…' : 'Create User Account'}
          </button>
        </form>
      </section>

      {/* Users Management List */}
      <section className="panel" aria-labelledby="users-list-heading">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 id="users-list-heading" className="text-sm font-semibold text-zinc-100">
            Registered Users ({users.length})
          </h3>
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh list'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th scope="col" className="px-3">User</th>
                <th scope="col" className="px-3">Status</th>
                <th scope="col" className="px-3">WhatsApp Linked</th>
                <th scope="col" className="px-3">Validity / Expiry</th>
                <th scope="col" className="px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {users.map((u) => {
                const validity = formatValidity(u.expiresAt, u.role);
                const isAdminRow = u.role === 'admin';
                const statusBadge = isAdminRow
                  ? 'border-amber-600/40 bg-amber-600/15 text-amber-400'
                  : !u.isActive
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-400'
                  : validity.expired
                  ? 'border-red-600/40 bg-red-600/15 text-red-400'
                  : 'border-emerald-600/40 bg-emerald-600/15 text-emerald-400';
                const statusText = isAdminRow
                  ? 'Admin'
                  : !u.isActive
                  ? 'Disabled'
                  : validity.expired
                  ? 'Expired'
                  : 'Active';

                return (
                  <tr key={u.id} className="transition-colors hover:bg-zinc-800/40">
                    <td className="px-3 py-3 font-medium text-zinc-100">{u.username}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {u.accounts?.length > 0
                        ? u.accounts.map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                              <span className={`status-dot ${a.connected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                              {a.connected ? `+${a.phone || a.name}` : `${a.name} (Offline)`}
                            </div>
                          ))
                        : 'No account'}
                    </td>
                    <td className="px-3 py-3 font-medium text-zinc-400">
                      {validity.text}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {isAdminRow ? (
                        <span className="text-[11px] text-zinc-400 italic">Controlled via Server ENV</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'timed', 24)}
                            className="rounded border border-zinc-700 px-2 py-1 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                            title="Give 24h from now"
                          >
                            +24h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'timed', 168)}
                            className="rounded border border-zinc-700 px-2 py-1 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                            title="Give 7 days from now"
                          >
                            +7d
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetAccess(u, 'unlimited')}
                            className="rounded border border-emerald-600/40 bg-emerald-600/10 px-2 py-1 font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20"
                            title="Switch to Unlimited access"
                          >
                            Unlimited
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="rounded border border-zinc-700 px-2 py-1 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                          >
                            Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className="rounded border border-zinc-700 px-2 py-1 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="rounded border border-red-600/40 bg-red-600/10 px-2 py-1 font-medium text-red-400 transition-colors hover:bg-red-600/20"
                          >
                            Delete
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
      </section>
    </div>
  );
}
