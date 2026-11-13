// Props-driven: logs arrive from the dashboard snapshot poll (Dashboard.jsx),
// so this component runs no polling loop of its own.
export default function ActivityLogs({ logs }) {
  const list = Array.isArray(logs) ? logs : [];
  const loading = logs == null; // snapshot hasn't arrived yet

  const levelColor = (level) => {
    switch (level) {
      case 'error': return 'border-red-600/40 bg-red-600/15 text-red-400';
      case 'warn': return 'border-amber-600/40 bg-amber-600/15 text-amber-400';
      default: return 'border-emerald-600/40 bg-emerald-600/15 text-emerald-400';
    }
  };

  return (
    <section className="panel" aria-labelledby="logs-heading">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="logs-heading" className="panel-title">Activity Logs</h2>
        <span className="text-[11px] text-zinc-400">Last 30 entries</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-5/6" />
          <div className="skeleton h-6 w-2/3" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-400">No activity yet. Connect WhatsApp and start automation to see logs.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[560px]">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Level</th>
                <th scope="col">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {list.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-zinc-800/40">
                  <td className="py-2.5 pr-4 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${levelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-300">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
