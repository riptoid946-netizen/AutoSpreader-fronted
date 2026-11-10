import { useState, useEffect } from 'react';
import { getWhatsAppStatus, disconnectWhatsApp } from '../services/api';

export default function ConnectionSection() {
  const [status, setStatus] = useState({ connected: false, qrCode: null, clientInfo: null });
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

  useEffect(() => {
    loadStatus();
    // Poll for QR code and connection status every 3 seconds
    const id = setInterval(loadStatus, 3000);
    setPollInterval(id);
    return () => clearInterval(id);
  }, []);

  async function loadStatus() {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnectWhatsApp();
      setStatus({ connected: false, qrCode: null, clientInfo: null });
    } catch (err) {
      alert('Disconnect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">🔗</span>
        WhatsApp Connection
      </h2>

      <div className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</p>
            <p className={`font-medium ${status.connected ? 'text-green-700' : status.qrCode ? 'text-amber-700' : 'text-slate-600'}`}>
              {status.connected ? '✅ Connected' : status.qrCode ? '⏳ Waiting for scan' : '❌ Not Connected'}
            </p>
          </div>
          {status.clientInfo?.phone && (
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              {status.clientInfo.phone}
            </span>
          )}
        </div>

        {!status.connected ? (
          <div className="space-y-3">
            {status.qrCode ? (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50">
                <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
                  Scan this QR with WhatsApp
                </p>
                <img
                  src={status.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 bg-white rounded p-1 shadow-sm"
                />
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this QR
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">Waiting for WhatsApp client to start...</p>
                <p className="text-xs text-slate-400 italic mt-1">
                  Make sure backend is running (port 3001).
                </p>
              </div>
            )}
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded font-medium text-sm transition"
            >
              {loading ? 'Disconnecting...' : 'Disconnect / Reset'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-green-700 font-medium">✅ WhatsApp is linked and ready</p>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full mt-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded font-medium text-sm transition"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400 italic">
        Personal WhatsApp via local session. Use delays to avoid getting banned.
      </p>
    </div>
  );
}
