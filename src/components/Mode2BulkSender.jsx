import { useState, useEffect, useRef } from 'react';
import { startMode2, stopBulk, getBulkStatus } from '../services/api';
import MediaAttachmentPicker from './MediaAttachmentPicker';
import MultiMessageEditor from './MultiMessageEditor';

export default function Mode2BulkSender() {
  const [numbersText, setNumbersText] = useState('');
  const [messagesList, setMessagesList] = useState(['']);
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [voicePath, setVoicePath] = useState(null);
  const [voiceName, setVoiceName] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(10);

  const [bulkStatus, setBulkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startedInfo, setStartedInfo] = useState(null);
  // Synchronous guard: blocks a second submit before React re-renders the disabled button
  const submittingRef = useRef(false);
  const infoTimerRef = useRef(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const data = await getBulkStatus();
      setBulkStatus(data);
    } catch (err) {
      // ignore
    }
  }

  // Count valid numbers in textarea (mirrors backend parseAndCleanNumbers rules)
  const parsedNumbers = numbersText
    .split(/[\r\n,;]+/)
    .map((n) => n.trim().replace(/[^0-9]/g, '').replace(/^0+/, ''))
    .filter((n) => n.length >= 10 && n.length <= 15);
  const uniqueCount = new Set(parsedNumbers).size;

  const isCurrentMode2Running = bulkStatus?.running && bulkStatus?.mode === 'mode2';

  async function handleStart(e) {
    e.preventDefault();
    setError(null);

    // Hard double-submit guard (covers the gap before the button visually disables)
    if (submittingRef.current) return;

    if (uniqueCount === 0) {
      setError('Please enter at least one valid phone number (10+ digits).');
      return;
    }
    const cleanMessages = messagesList.map((m) => String(m || '').trim()).filter(Boolean);
    if (cleanMessages.length === 0 && !filePath && !voicePath) {
      setError('Please provide at least a message text, a file/APK, or a voice note.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const result = await startMode2({
        numbers: numbersText,
        message: cleanMessages[0] || '',
        messages: cleanMessages,
        filePath,
        fileName,
        voicePath,
        voiceName,
        delaySeconds,
      });
      showInfo(
        result.duplicate
          ? `Already started — duplicate click ignored (campaign #${result.campaignId} is running).`
          : `🚀 Campaign #${result.campaignId} started to ${result.total} contact${result.total === 1 ? '' : 's'}. Sending 1-by-1 — progress shows below.`
      );
      await checkStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  function showInfo(text) {
    setStartedInfo(text);
    if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    infoTimerRef.current = setTimeout(() => setStartedInfo(null), 8000);
  }

  // Clear pending timer when the component unmounts (account/tab switch)
  useEffect(() => {
    return () => {
      if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
    };
  }, []);

  async function handleStop() {
    try {
      await stopBulk();
      await checkStatus();
    } catch (err) {
      alert('Failed to stop: ' + err.message);
    }
  }

  return (
    <section className="panel" aria-labelledby="mode2-heading">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 id="mode2-heading" className="panel-title flex items-center gap-2">
          <span className="num-chip">2</span>
          Mode 2: Targeted Bulk Sender
        </h2>
        {isCurrentMode2Running && (
          <span className="chip chip-info">
            <span className="status-dot bg-sky-500 animate-pulse" /> Sending…
          </span>
        )}
      </div>

      {/* Success confirmation — so you KNOW it started & don't click again */}
      {startedInfo && (
        <div className="mb-4 rounded-lg border border-emerald-700/50 bg-emerald-700/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300" role="status">
          {startedInfo}
        </div>
      )}

      {/* Live Bulk Progress Card */}
      {bulkStatus?.mode === 'mode2' && (bulkStatus.running || bulkStatus.current > 0) && (
        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              Campaign progress: {bulkStatus.current} / {bulkStatus.total} ({bulkStatus.progressPercentage}%)
            </span>
            <span className="text-[11px] font-medium text-zinc-400">
              {bulkStatus.sent} sent · {bulkStatus.failed} failed
            </span>
          </div>

          <div className="progress-track mb-2">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${bulkStatus.progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>
              {bulkStatus.running
                ? `Sending to: +${bulkStatus.currentRecipient || '...'}`
                : bulkStatus.completed
                ? 'Campaign finished'
                : 'Campaign stopped'}
            </span>
            {bulkStatus.running && (
              <button
                type="button"
                onClick={handleStop}
                className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-red-600/60 hover:bg-red-600/10 hover:text-red-400"
              >
                Stop sending
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
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="label mb-0">Phone numbers list</label>
            <span className="chip chip-info">{uniqueCount} valid numbers</span>
          </div>
          <textarea
            value={numbersText}
            onChange={(e) => setNumbersText(e.target.value)}
            disabled={isCurrentMode2Running}
            rows={4}
            className="field-sm font-mono leading-relaxed"
            placeholder="Paste phone numbers separated by newlines or commas:
918766375361
919876543210
+91 91234 56789"
          />
          <p className="hint">
            Tip: You can include country code (e.g. 91). 10-digit Indian numbers auto-prepend 91.
          </p>
        </div>

        <MultiMessageEditor
          messages={messagesList}
          onChange={setMessagesList}
          disabled={isCurrentMode2Running}
          label="Text messages"
          placeholder="Type your message text here..."
        />

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
          <label className="label">Anti-ban delay between numbers (seconds)</label>
          <input
            type="number"
            min="8"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Math.max(8, parseInt(e.target.value) || 8))}
            disabled={isCurrentMode2Running}
            className="field-sm sm:w-48"
          />
          <p className="hint">
            Strictly 1-by-1 sending (+0–6s random jitter aur har 10 numbers par 25–40s breather pause). Min: 8s.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || isCurrentMode2Running || uniqueCount === 0}
            className={`flex-1 ${loading || isCurrentMode2Running || uniqueCount === 0 ? 'btn-disabled' : 'btn-primary'}`}
          >
            {loading
              ? 'Starting…'
              : isCurrentMode2Running
              ? 'Bulk sending active'
              : `Start bulk sending (${uniqueCount} contacts)`}
          </button>

          {isCurrentMode2Running && (
            <button type="button" onClick={handleStop} className="btn-danger px-5">
              Stop
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
