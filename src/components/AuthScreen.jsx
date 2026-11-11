import { useState, useEffect } from 'react';
import { getAuthSetupStatus, loginUser, setupOwner } from '../services/api';
import BrandLogo from './BrandLogo';

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
    <main className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="max-w-sm w-full rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7">
        <div className="mb-6">
          <BrandLogo size={40} />
          <h1 className="mt-4 text-lg font-semibold text-zinc-100">
            AutoSpreader Control Panel
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Authorized access only · Admin &amp; approved users
          </p>
        </div>

        {error && (
          <div className="banner banner-rose mb-4">
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={needsOwnerSetup ? 'e.g. admin' : 'Enter your username'}
              minLength={3}
              maxLength={32}
              required
              autoFocus
              className="field"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              minLength={4}
              required
              className="field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
          >
            {loading
              ? 'Signing in…'
              : needsOwnerSetup
              ? 'Set up admin & continue'
              : 'Sign in to dashboard'}
          </button>
        </form>

        {!needsOwnerSetup && (
          <p className="mt-5 text-center text-[11px] text-zinc-400">
            New account access? Contact Admin to generate your username &amp; password.
          </p>
        )}
      </div>
    </main>
  );
}
