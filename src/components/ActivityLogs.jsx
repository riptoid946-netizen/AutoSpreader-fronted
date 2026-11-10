import { useState, useEffect } from 'react';
import { getLogs } from '../services/api';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadLogs() {
    try {
      const data = await getLogs(30);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const levelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-amber-600 bg-amber-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">📋</span>
          Activity Logs
        </h2>
        <span className="text-xs text-slate-400">Last 30 entries</span>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm italic">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-slate-400 text-sm italic">No activity yet. Connect WhatsApp and start automation to see logs.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-xs text-slate-400 font-medium uppercase">Time</th>
                <th className="pb-2 text-xs text-slate-400 font-medium uppercase">Level</th>
                <th className="pb-2 text-xs text-slate-400 font-medium uppercase">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 text-slate-500 text-xs font-mono">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-slate-700 text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
