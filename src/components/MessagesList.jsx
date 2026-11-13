import { useState, useMemo } from 'react';
import { clearMessages } from '../services/api';

// Props-driven: messages arrive from the dashboard snapshot poll (Dashboard.jsx),
// so this component runs no polling loop of its own. onRefresh re-pulls the
// snapshot after a mutation (Clear).
export default function MessagesList({ messages, onRefresh }) {
  const [filter, setFilter] = useState('all'); // all, incoming, outgoing
  const [search, setSearch] = useState('');
  const [clearing, setClearing] = useState(false);

  const list = Array.isArray(messages) ? messages : [];
  const loading = messages == null; // snapshot hasn't arrived yet

  async function handleClear() {
    if (window.confirm('Are you sure you want to clear message history and reply records?')) {
      setClearing(true);
      try {
        await clearMessages();
        if (onRefresh) await onRefresh();
      } catch (err) {
        alert('Failed to clear: ' + err.message);
      } finally {
        setClearing(false);
      }
    }
  }

  const filtered = useMemo(
    () =>
      list.filter((m) => {
        if (filter === 'incoming' && m.direction !== 'incoming') return false;
        if (filter === 'outgoing' && m.direction !== 'outgoing') return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchText = (m.message_text || '').toLowerCase().includes(q);
          const matchPhone = (m.phone_number || '').toLowerCase().includes(q);
          const matchName = (m.sender_name || '').toLowerCase().includes(q);
          return matchText || matchPhone || matchName;
        }
        return true;
      }),
    [list, filter, search]
  );

  const counts = useMemo(
    () => ({
      incoming: list.filter((m) => m.direction === 'incoming').length,
      outgoing: list.filter((m) => m.direction === 'outgoing').length,
    }),
    [list]
  );

  return (
    <section className="panel" aria-labelledby="messages-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="messages-heading" className="panel-title">Saved Messages &amp; Inquiries</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time log of every message received from users and auto-replies sent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="chip chip-success">{counts.incoming} received</span>
          <span className="chip chip-idle">{counts.outgoing} replied</span>
          {list.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              aria-label="Clear message logs"
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
              title="Clear message logs"
            >
              {clearing ? 'Clearing…' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search by phone, name or text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-sm flex-1"
        />
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === 'all'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            All ({list.length})
          </button>
          <button
            onClick={() => setFilter('incoming')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === 'incoming'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Users ({counts.incoming})
          </button>
          <button
            onClick={() => setFilter('outgoing')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === 'outgoing'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Auto Replies ({counts.outgoing})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5 py-1">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-5/6" />
          <div className="skeleton h-16 w-4/6" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-10 text-center">
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {list.length === 0
              ? 'No messages yet. When a user sends a message on WhatsApp, it will be saved and displayed here automatically.'
              : 'No matching messages found for current filter.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[380px] -mr-2.5 space-y-2.5 overflow-y-auto [scrollbar-gutter:stable]">
          {filtered.map((msg) => {
            const isIncoming = msg.direction === 'incoming';
            return (
              <div
                key={msg.id}
                className={`rounded-lg border p-3 text-xs ${
                  isIncoming
                    ? 'border-zinc-800 bg-zinc-950/60'
                    : 'border-emerald-600/30 bg-emerald-600/10'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isIncoming
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-emerald-600/20 text-emerald-400'
                      }`}
                    >
                      {isIncoming ? 'User Message' : 'Outbound Reply'}
                    </span>
                    <span className="truncate font-medium text-zinc-200">
                      {isIncoming
                        ? msg.sender_name && msg.sender_name !== msg.phone_number
                          ? `${msg.sender_name} (+${msg.phone_number})`
                          : `+${msg.phone_number}`
                        : `To: +${msg.phone_number}`}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-400 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-zinc-300">
                  {msg.message_text}
                </p>
                {(msg.file_name || msg.has_file || msg.has_voice) && (
                  <div className="mt-2 flex items-center gap-2 border-t border-zinc-800 pt-2">
                    {(msg.file_name || msg.has_file) && (
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 font-mono">
                        File: {msg.file_name || 'Attached File'}
                      </span>
                    )}
                    {Boolean(msg.has_voice) && (
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 font-mono">
                        Voice note sent
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
