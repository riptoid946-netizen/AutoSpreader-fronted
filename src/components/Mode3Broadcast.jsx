import { useState, useEffect } from 'react';
import { startMode3, stopBulk, getBulkStatus, getWhatsAppChats } from '../services/api';
import MediaAttachmentPicker from './MediaAttachmentPicker';

export default function Mode3Broadcast() {
  const [messageText, setMessageText] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [voicePath, setVoicePath] = useState(null);
  const [voiceName, setVoiceName] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(12);
  const [includeGroups, setIncludeGroups] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);

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
  }, [includeGroups, onlyUnread]);

  async function fetchChats() {
    setLoadingChats(true);
    try {
      const res = await getWhatsAppChats(includeGroups, onlyUnread);
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
        onlyUnread,
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
    <section className="panel" aria-labelledby="mode3-heading">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 id="mode3-heading" className="panel-title flex items-center gap-2">
          <span className="num-chip">3</span>
          Mode 3: Broadcast to All Contacts
        </h2>
        {isCurrentMode3Running && (
          <span className="chip chip-violet">
            <span className="status-dot bg-violet-500 animate-pulse" /> Broadcasting…
          </span>
        )}
      </div>

      {/* Live Broadcast Progress Card */}
      {bulkStatus?.mode === 'mode3' && (bulkStatus.running || bulkStatus.current > 0) && (
        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              Broadcast progress: {bulkStatus.current} / {bulkStatus.total} ({bulkStatus.progressPercentage}%)
            </span>
            <span className="text-[11px] font-medium text-zinc-400">
              {bulkStatus.sent} sent · {bulkStatus.failed} failed
            </span>
          </div>

          <div className="progress-track mb-2">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${bulkStatus.progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>
              {bulkStatus.running
                ? `Currently sending to: ${bulkStatus.currentRecipient || '...'}`
                : bulkStatus.completed
                ? 'Broadcast completed'
                : 'Broadcast stopped'}
            </span>
            {bulkStatus.running && (
              <button
                type="button"
                onClick={handleStop}
                className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-red-600/60 hover:bg-red-600/10 hover:text-red-400"
              >
                Stop broadcast
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="banner banner-rose mb-4">
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleStart} className="space-y-4">
        {/* Contacts Discovery Banner */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="block text-xs font-semibold text-zinc-300">
              Target audience (WhatsApp chats)
            </span>
            <span className="text-xs text-zinc-400">
              {loadingChats ? 'Scanning chats…' : `${chatsCount ?? 0} active contacts found in your WhatsApp`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                disabled={isCurrentMode3Running}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950"
              />
              <span>Only unread / pending</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeGroups}
                onChange={(e) => setIncludeGroups(e.target.checked)}
                disabled={isCurrentMode3Running}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950"
              />
              <span>Include groups</span>
            </label>
            <button
              type="button"
              onClick={fetchChats}
              className="text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
            >
              Refresh
            </button>
          </div>
        </div>

        <div>
          <label className="label">Broadcast text message</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isCurrentMode3Running}
            rows={3}
            className="field-sm leading-relaxed"
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
          <label className="label">Anti-ban delay between each contact (seconds)</label>
          <input
            type="number"
            min="8"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Math.max(8, parseInt(e.target.value) || 8))}
            disabled={isCurrentMode3Running}
            className="field-sm sm:w-48"
          />
          <p className="hint">
            Strictly 1-by-1 sending (+0–6s random jitter aur har 10 chats par 25–40s anti-ban pause). Min: 8s.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || isCurrentMode3Running || chatsCount === 0}
            className={`flex-1 ${loading || isCurrentMode3Running || chatsCount === 0 ? 'btn-disabled' : 'btn-primary'}`}
          >
            {loading
              ? 'Starting…'
              : isCurrentMode3Running
              ? 'Broadcast active'
              : `Start ${onlyUnread ? 'unread' : 'all'} broadcast (${chatsCount ?? 0} chats)`}
          </button>

          {isCurrentMode3Running && (
            <button type="button" onClick={handleStop} className="btn-danger px-5">
              Stop
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
