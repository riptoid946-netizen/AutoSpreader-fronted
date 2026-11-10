import { useState, useEffect } from 'react';
import { startMode2, stopBulk, getBulkStatus } from '../services/api';
import MediaAttachmentPicker from './MediaAttachmentPicker';

export default function Mode2BulkSender() {
  const [numbersText, setNumbersText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [voicePath, setVoicePath] = useState(null);
  const [voiceName, setVoiceName] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(6);

  const [bulkStatus, setBulkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Count valid numbers in textarea
  const parsedNumbers = numbersText
    .split(/[\r\n,;]+/)
    .map((n) => n.trim().replace(/[^0-9]/g, ''))
    .filter((n) => n.length >= 10);
  const uniqueCount = new Set(parsedNumbers).size;

  const isCurrentMode2Running = bulkStatus?.running && bulkStatus?.mode === 'mode2';

  async function handleStart(e) {
    e.preventDefault();
    setError(null);

    if (uniqueCount === 0) {
      setError('Please enter at least one valid phone number (10+ digits).');
      return;
    }
    if (!messageText.trim() && !filePath && !voicePath) {
      setError('Please provide at least a message text, a file/APK, or a voice note.');
      return;
    }

    setLoading(true);
    try {
      await startMode2({
        numbers: numbersText,
        message: messageText,
        filePath,
        fileName,
        voicePath,
        voiceName,
        delaySeconds,
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
          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
          Mode 2: Targeted Bulk Sender (Custom Numbers)
        </h2>
        {isCurrentMode2Running && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 animate-pulse">
            ● Sending Bulk Messages...
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Send custom text, separate APK/File, and separate Voice Note to a list of specified phone numbers with automatic anti-ban delay.
      </p>

      <div className="flex items-start gap-2 p-2.5 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
        <span className="text-sm">✨</span>
        <span>
          <strong>Realistic Human Simulation Active:</strong> WhatsApp par blue tick (seen), real typing indicator ("typing..."), file picker delay, aur voice note bhejte waqt real mic animation ("recording audio...") dikhayega.
        </span>
      </div>

      {/* Live Bulk Progress Card */}
      {bulkStatus?.mode === 'mode2' && (bulkStatus.running || bulkStatus.current > 0) && (
        <div className="mb-5 p-4 rounded-xl border border-blue-200 bg-blue-50/60 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-blue-900">
              Bulk Campaign Progress: {bulkStatus.current} / {bulkStatus.total} ({bulkStatus.progressPercentage}%)
            </span>
            <span className="text-xs font-mono font-bold text-blue-700">
              ✅ {bulkStatus.sent} Sent • ❌ {bulkStatus.failed} Failed
            </span>
          </div>

          <div className="w-full bg-blue-200/70 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${bulkStatus.progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>
              {bulkStatus.running
                ? `Sending to: +${bulkStatus.currentRecipient || '...'}`
                : bulkStatus.completed
                ? '🏁 Campaign Finished'
                : '⏹ Campaign Stopped'}
            </span>
            {bulkStatus.running && (
              <button
                type="button"
                onClick={handleStop}
                className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-0.5 rounded font-bold transition shadow-sm"
              >
                Stop Sending
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wide">
              Phone Numbers List
            </label>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {uniqueCount} Valid Numbers Detected
            </span>
          </div>
          <textarea
            value={numbersText}
            onChange={(e) => setNumbersText(e.target.value)}
            disabled={isCurrentMode2Running}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs font-mono leading-relaxed"
            placeholder="Paste phone numbers separated by newlines or commas:
918766375361
919876543210
+91 91234 56789"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tip: You can include country code (e.g. 91). 10-digit Indian numbers auto-prepend 91.
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wide">
            Text Message
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isCurrentMode2Running}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs leading-relaxed"
            placeholder="Type your message text here..."
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
            Delay between numbers (seconds)
          </label>
          <input
            type="number"
            min="2"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Math.max(2, parseInt(e.target.value) || 2))}
            disabled={isCurrentMode2Running}
            className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">Recommended: 5–10 seconds per number to avoid spam detection.</p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading || isCurrentMode2Running || uniqueCount === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2.5 rounded-lg font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading ? 'Starting...' : isCurrentMode2Running ? 'Bulk Sending Active' : `🚀 Start Bulk Sending (${uniqueCount} contacts)`}
          </button>

          {isCurrentMode2Running && (
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

