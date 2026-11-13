import { useState, useEffect, useRef } from 'react';
import {
  getWhatsAppStatus,
  disconnectWhatsApp,
  connectAccount,
  getActiveAccountId,
} from '../services/api';
import { smartPoll } from '../services/smartPoll';

export default function ConnectionSection() {
  const [status, setStatus] = useState({ connected: false, initializing: false, qrCode: null, qrVersion: 0, clientInfo: null });
  const [loading, setLoading] = useState(false);
  const qrVersionRef = useRef(null);

  // Poll faster (1s) while launching browser or syncing after QR scan; 3s otherwise.
  // smartPoll skips ticks while the tab is hidden and refreshes on return.
  const fastPoll = Boolean((status.initializing || status.authenticating) && !status.connected);
  useEffect(() => {
    return smartPoll(loadStatus, fastPoll ? 1000 : 3000);
  }, [fastPoll]);

  async function loadStatus() {
    try {
      const data = await getWhatsAppStatus(qrVersionRef.current);
      setStatus((prev) => {
        const nextQr = data.qrUnchanged ? prev.qrCode : (data.qrCode ?? null);
        qrVersionRef.current = nextQr ? (data.qrVersion ?? null) : null;
        if (!prev.connected && data.connected) {
          window.dispatchEvent(new CustomEvent('wa-status-changed', { detail: data }));
        }
        return {
          ...data,
          qrCode: nextQr,
        };
      });
    } catch (err) {
      // handled gracefully
    }
  }

  async function handleConnect() {
    setLoading(true);
    try {
      const accId = status.accountId || getActiveAccountId();
      if (accId) {
        await connectAccount(accId);
      }
      await loadStatus();
    } catch (err) {
      alert('Connect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnectWhatsApp();
      qrVersionRef.current = null;
      setStatus({ connected: false, qrCode: null, qrVersion: 0, clientInfo: null });
    } catch (err) {
      alert('Disconnect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="connection-heading">
      <h2 id="connection-heading" className="panel-title mb-4">WhatsApp Connection</h2>

      <div className="space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
          <div>
            <p className="text-[11px] font-medium text-zinc-400">Status</p>
            <p
              className={`mt-0.5 flex items-center gap-2 text-sm font-medium ${
                status.connected
                  ? 'text-emerald-400'
                  : status.authenticating
                  ? 'text-emerald-300'
                  : status.qrCode
                  ? 'text-amber-400'
                  : status.initializing
                  ? 'text-zinc-300'
                  : 'text-zinc-400'
              }`}
            >
              {status.connected ? (
                <>
                  <span className="status-dot bg-emerald-500 animate-pulse" /> Connected
                </>
              ) : status.authenticating ? (
                <>
                  <span className="status-dot bg-emerald-400 animate-pulse" /> QR scanned — syncing chats…
                </>
              ) : status.qrCode ? (
                <>
                  <span className="status-dot bg-amber-500" /> Waiting for scan
                </>
              ) : status.initializing ? (
                <>
                  <span className="status-dot bg-zinc-500 animate-pulse" /> Starting browser &amp; QR…
                </>
              ) : (
                <>
                  <span className="status-dot bg-zinc-600" /> Not connected
                </>
              )}
            </p>
          </div>
          {status.clientInfo?.phone && (
            <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-400 font-mono">
              {status.clientInfo.phone}
            </span>
          )}
        </div>

        {!status.connected ? (
          <div className="space-y-3">
            {status.authenticating ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="spinner" />
                <p className="text-xs font-medium text-emerald-300">
                  QR Scanned! Syncing WhatsApp chats
                  {typeof status.loadingPercent === 'number' ? ` (${status.loadingPercent}%)` : '…'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Wait 5–15 seconds — page refresh ya reset mat karna.
                </p>
              </div>
            ) : status.qrCode ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[11px] font-medium text-zinc-400">
                  Scan this QR with WhatsApp
                </p>
                <div className="mt-3 inline-block rounded-lg border border-zinc-700 bg-white p-2">
                  <img
                    src={status.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 rounded"
                  />
                </div>
                <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                  Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this QR
                </p>
              </div>
            ) : status.initializing ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="spinner" />
                <p className="text-xs font-medium text-zinc-400">
                  Launching WhatsApp session &amp; generating QR code…
                </p>
                <p className="text-[11px] text-zinc-400">
                  Isme 10–15 seconds lag sakte hain.
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {status.lastError && (
                  <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-3 py-2 text-[11px] text-amber-300">
                    Browser issue: {status.lastError}. Click Connect again or Disconnect / Reset.
                  </div>
                )}
                <p className="text-xs text-zinc-400">
                  Click below to start WhatsApp and generate your private QR code.
                </p>
                <button onClick={handleConnect} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Starting…' : 'Connect WhatsApp / Show QR Code'}
                </button>
              </div>
            )}
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="btn-danger-outline w-full"
            >
              {loading ? 'Disconnecting…' : 'Disconnect / Reset'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="status-dot bg-emerald-500" /> WhatsApp is linked and ready
            </p>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="btn-danger-outline w-full"
            >
              {loading ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] text-zinc-400">
        Personal WhatsApp via local session. Use delays to avoid getting banned.
      </p>
    </section>
  );
}
