import { useState, useEffect } from 'react';
import { startMode3, stopBulk, getBulkStatus, getWhatsAppChats } from '../services/api';
import MediaAttachmentPicker from './MediaAttachmentPicker';

export default function Mode3Broadcast() {
  const [messageText, setMessageText] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [voicePath, setVoicePath] = useState(null);
  const [voiceName, setVoiceName] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(8);
  const [includeGroups, setIncludeGroups] = useState(false);

  const [chatsCount, setChatsCount] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChats();
    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => clearInterval(interval);
  }, [includeGroups]);

  async function fetchChats() {
    setLoadingChats(true);
    try {
      const res = await getWhatsAppChats(includeGroups);
      setChatsCount(res.count ?? 0);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }

  async function checkStatus() {
    try {
      const data = await getBulkStatus();
      setBulkStatus(data);
    } catch (err) {
      // ignore
    }
  }

  const isCurrentMode3Running = bulkStatus?.running && bulkStatus?.mode === 'mode3';

  async function handleStart(e) {
    e.preventDefault();
    setError(null);

    if (!chatsCount || chatsCount === 0) {
      setError('No chats found on linked WhatsApp. Connect WhatsApp and have active chats.');
      return;
    }

    if (!messageText.trim() && !filePath && !voicePath) {
      setError('Please provide at least a message text, a file/APK, or a voice note.');
      return;
    }

    if (!window.confirm(`Are you sure you want to broadcast to ${chatsCount} contacts?`)) {
      return;
    }

    setLoading(true);
    try {
      await startMode3({
        message: messageText,
        filePath,
        fileName,
        voicePath,
        voiceName,
        delaySeconds,
        includeGroups,
      });
      await checkStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    try {
      await stopBulk();
      await checkStatus();
    } catch (err) {
      alert('Failed to stop: ' + err.message);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
          Mode 3: Broadcast to All Contacts
        </h2>
        {isCurrentMode3Running && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 animate-pulse">
            ● Broadcasting to All Contacts...
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Broadcast your message, separate APK/File, and separate Voice Note to every contact in your WhatsApp account automatically.
      </p>

      <div className="flex items-start gap-2 p-2.5 mb-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[11px] leading-relaxed">
        <span className="text-sm">✨</span>
        <span>
          <strong>Realistic Human Simulation Active:</strong> WhatsApp par blue tick (seen), real typing indicator ("typing..."), file picker delay, aur voice note bhejte waqt real mic animation ("recording audio...") dikhayega.
        </span>
      </div>

      {/* Live Broadcast Progress Card */}
      {bulkStatus?.mode === 'mode3' && (bulkStatus.running || bulkStatus.current > 0) && (
        <div className="mb-5 p-4 rounded-xl border border-purple-200 bg-purple-50/60 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-purple-900">
              Broadcast Progress: {bulkStatus.current} / {bulkStatus.total} ({bulkStatus.progressPercentage}%)
            </span>
            <span className="text-xs font-mono font-bold text-purple-700">
              ✅ {bulkStatus.sent} Sent • ❌ {bulkStatus.failed} Failed
            </span>
          </div>

          <div className="w-full bg-purple-200/70 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${bulkStatus.progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>
              {bulkStatus.running
                ? `Currently sending to: ${bulkStatus.currentRecipient || '...'}`
                : bulkStatus.completed
                ? '🏁 Broadcast Completed'
                : '⏹ Broadcast Stopped'}
            </span>
            {bulkStatus.running && (
              <button
                type="button"
                onClick={handleStop}
                className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-0.5 rounded font-bold transition shadow-sm"
              >
                Stop Broadcast
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleStart} className="space-y-4">
        {/* Contacts Discovery Banner */}
        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-purple-900 block">
              👥 Target Audience (WhatsApp Chats):
            </span>
            <span className="text-xs text-purple-700">
              {loadingChats ? 'Scanning chats...' : `${chatsCount ?? 0} active contacts found in your WhatsApp`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGroups}
                onChange={(e) => setIncludeGroups(e.target.checked)}
                disabled={isCurrentMode3Running}
                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Include Groups</span>
            </label>
            <button
              type="button"
              onClick={fetchChats}
              className="text-xs text-purple-700 underline font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wide">
            Broadcast Text Message
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isCurrentMode3Running}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none text-xs leading-relaxed"
            placeholder="Type your broadcast message text here..."
          />
        </div>

        {/* Media Attachments Picker (APK / Files & Voice Notes) */}
        <MediaAttachmentPicker
          filePath={filePath}
          fileName={fileName}
          onFileChange={(path, name) => {
            setFilePath(path);
            setFileName(name);
          }}
          voicePath={voicePath}
          voiceName={voiceName}
          onVoiceChange={(path, name) => {
            setVoicePath(path);
            setVoiceName(name);
          }}
        />

        <div>
          <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wide">
            Anti-Ban Delay between each contact (seconds)
          </label>
          <input
            type="number"
            min="3"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Math.max(3, parseInt(e.target.value) || 3))}
            disabled={isCurrentMode3Running}
            className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none text-xs"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">Recommended: 8–15 seconds per contact for safe broadcasting.</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading || isCurrentMode3Running || chatsCount === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2.5 rounded-lg font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading ? 'Starting...' : isCurrentMode3Running ? 'Broadcast Active' : `📢 Start Broadcast to All (${chatsCount ?? 0} chats)`}
          </button>

          {isCurrentMode3Running && (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

