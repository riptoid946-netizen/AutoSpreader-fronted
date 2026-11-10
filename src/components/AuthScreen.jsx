import { useState, useEffect } from 'react';
import { getAuthSetupStatus, loginUser, registerUser } from '../services/api';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [needsOwnerSetup, setNeedsOwnerSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAuthSetupStatus()
      .then((res) => {
        if (res?.needsOwnerSetup) {
          setNeedsOwnerSetup(true);
          setMode('register');
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        mode === 'register'
          ? await registerUser(username.trim(), password)
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
          <h1 className="text-xl font-black text-slate-900">AutoSpreader WhatsApp</h1>
          <p className="text-xs text-slate-500">
            Har user ka apna alag private dashboard, QR link aur automation controls.
          </p>
        </div>

        {needsOwnerSetup && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong className="block mb-0.5">👑 First-Time Owner Setup:</strong>
            Apna Admin Username & Password banayein — aapka pehle se connected WhatsApp account lock & claim ho jayega. Baaki users alag account banakar apna dashboard use kar payenge.
          </div>
        )}

        {!needsOwnerSetup && (
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🔐 Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ✨ New User Account
            </button>
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
              placeholder="e.g. rahul_team"
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
              placeholder="Min 4 characters"
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
              ? 'Please wait...'
              : needsOwnerSetup
              ? '👑 Create Owner Account & Enter'
              : mode === 'register'
              ? '🚀 Create My Private Dashboard'
              : '🔓 Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
