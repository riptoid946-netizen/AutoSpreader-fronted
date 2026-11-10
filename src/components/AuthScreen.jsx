import { useState, useEffect } from 'react';
import { getAuthSetupStatus, loginUser, setupOwner } from '../services/api';

export default function AuthScreen({ onAuthenticated }) {
  const [needsOwnerSetup, setNeedsOwnerSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAuthSetupStatus()
      .then((res) => {
        setNeedsOwnerSetup(Boolean(res?.needsOwnerSetup));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = needsOwnerSetup
        ? await setupOwner(username.trim(), password)
        : await loginUser(username.trim(), password);
      if (onAuthenticated) {
        onAuthenticated(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            ⚡
          </div>
          <h1 className="text-xl font-black text-slate-900">AutoSpreader Control Panel</h1>
          <p className="text-xs text-slate-500">
            Authorized Access Only • Admin & Approved Users Login
          </p>
        </div>

        {needsOwnerSetup && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong className="block mb-0.5">👑 First-Time Admin Setup:</strong>
            Server par <code className="bg-amber-100 px-1 rounded">ADMIN_PASSWORD</code> env set nahi hai — apna Admin Username & Password abhi set karein (ya Railway Variables me <code className="bg-amber-100 px-1 rounded">ADMIN_USERNAME</code> / <code className="bg-amber-100 px-1 rounded">ADMIN_PASSWORD</code> add karein).
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={needsOwnerSetup ? 'e.g. admin' : 'Enter your username'}
              minLength={3}
              maxLength={32}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              minLength={4}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm transition shadow-sm"
          >
            {loading
              ? 'Verifying...'
              : needsOwnerSetup
              ? '👑 Setup Admin & Open Panel'
              : '🔐 Sign In to Dashboard'}
          </button>
        </form>

        {!needsOwnerSetup && (
          <p className="text-[11px] text-center text-slate-400">
            New account access? Contact Admin to generate your username & password.
          </p>
        )}
      </div>
    </div>
  );
}
