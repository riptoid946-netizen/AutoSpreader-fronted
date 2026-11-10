import { useState, useEffect } from 'react';
import { getMessages, clearMessages } from '../services/api';

export default function MessagesList() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, incoming, outgoing
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, []);

  async function loadMessages() {
    try {
      const data = await getMessages(100);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (window.confirm('Are you sure you want to clear message history and reply records?')) {
      try {
        await clearMessages();
        await loadMessages();
      } catch (err) {
        alert('Failed to clear: ' + err.message);
      }
    }
  }

  const filtered = messages.filter((m) => {
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
  });

  const incomingCount = messages.filter((m) => m.direction === 'incoming').length;
  const outgoingCount = messages.filter((m) => m.direction === 'outgoing').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">💬</span>
            Saved Messages & Inquiries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time log of every message received from users and auto-replies sent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
            {incomingCount} Received
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-200">
            {outgoingCount} Replied
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition"
              title="Clear message logs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by phone, name or text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        />
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filter === 'all' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('incoming')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filter === 'incoming' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Users ({incomingCount})
          </button>
          <button
            onClick={() => setFilter('outgoing')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filter === 'outgoing' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Auto Replies ({outgoingCount})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-xs italic py-4">Loading messages...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-400 text-xs">
            {messages.length === 0
              ? 'No messages yet. When a user sends a message on WhatsApp, it will be saved and displayed here automatically.'
              : 'No matching messages found for current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((msg) => {
            const isIncoming = msg.direction === 'incoming';
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg border text-xs transition ${
                  isIncoming
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-indigo-50/50 border-indigo-100 ml-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isIncoming
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isIncoming ? 'User Message' : 'Outbound Reply'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {isIncoming
                        ? msg.sender_name && msg.sender_name !== msg.phone_number
                          ? `${msg.sender_name} (+${msg.phone_number})`
                          : `+${msg.phone_number}`
                        : `To: +${msg.phone_number}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap break-words pl-1 mt-1 leading-relaxed">
                  {msg.message_text}
                </p>
                {(msg.file_name || msg.has_file || msg.has_voice) && (
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/60">
                    {(msg.file_name || msg.has_file) && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono border border-emerald-200">
                        📦 File: {msg.file_name || 'Attached File'}
                      </span>
                    )}
                    {Boolean(msg.has_voice) && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono border border-purple-200">
                        🎙️ Voice Note Sent
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

