import { useState, useEffect } from 'react';
import {
  getConfig,
  updateConfig,
  startAutomation,
  stopAutomation,
  getAutomationStatus,
} from '../services/api';
import MediaAttachmentPicker from './MediaAttachmentPicker';

export default function AutomationSettings() {
  const [config, setConfig] = useState({
    mode1_enabled: 0,
    automated_message: 'Hello! Thank you for messaging us. We will get back to you shortly.',
    reply_delay_seconds: 10,
    reply_once_per_contact: 1,
    mode1_file_path: null,
    mode1_file_name: null,
    mode1_voice_path: null,
    mode1_voice_name: null,
  });
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  async function loadConfig() {
    try {
      const data = await getConfig();
      setConfig({
        mode1_enabled: data.mode1_enabled ?? 0,
        automated_message: data.automated_message || '',
        reply_delay_seconds: data.reply_delay_seconds ?? 10,
        reply_once_per_contact: data.reply_once_per_contact ?? 1,
        mode1_file_path: data.mode1_file_path || null,
        mode1_file_name: data.mode1_file_name || null,
        mode1_voice_path: data.mode1_voice_path || null,
        mode1_voice_name: data.mode1_voice_name || null,
      });
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }

  async function loadStatus() {
    try {
      const data = await getAutomationStatus();
      setRunning(data.running === 1 || data.running === true);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await updateConfig({
        mode1_enabled: config.mode1_enabled ? 1 : 0,
        automated_message: config.automated_message,
        reply_delay_seconds: config.reply_delay_seconds,
        reply_once_per_contact: config.reply_once_per_contact ? 1 : 0,
        mode1_file_path: config.mode1_file_path,
        mode1_file_name: config.mode1_file_name,
        mode1_voice_path: config.mode1_voice_path,
        mode1_voice_name: config.mode1_voice_name,
      });
      setConfig({
        mode1_enabled: data.mode1_enabled ?? 0,
        automated_message: data.automated_message,
        reply_delay_seconds: data.reply_delay_seconds ?? 10,
        reply_once_per_contact: data.reply_once_per_contact ?? 1,
        mode1_file_path: data.mode1_file_path || null,
        mode1_file_name: data.mode1_file_name || null,
        mode1_voice_path: data.mode1_voice_path || null,
        mode1_voice_name: data.mode1_voice_name || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    try {
      await startAutomation();
      setRunning(true);
      setConfig((prev) => ({ ...prev, mode1_enabled: 1 }));
    } catch (err) {
      alert('Start failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await stopAutomation();
      setRunning(false);
    } catch (err) {
      alert('Stop failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</span>
          Mode 1: Same Message Auto-Reply
        </h2>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${running ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {running ? '● Running' : '○ Inactive'}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Whenever a contact messages you on WhatsApp, send this text reply + separate optional APK/File + separate optional Voice Note.
      </p>

      <div className="flex items-start gap-2 p-2.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
        <span className="text-sm">🛡️</span>
        <span>
          <strong>Unread Catch-Up + Anti-Ban Active:</strong> Mode Start karte hi pehle se aaye hue sabhi <b>unread/pending</b> messages ko 1-by-1 safe delay gap se reply karega + real typing, seen aur voice recording animation dikhayega.
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.mode1_enabled === 1}
              onChange={(e) => setConfig({ ...config, mode1_enabled: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-700">Enable Mode 1 Auto-Reply</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.reply_once_per_contact === 1}
              onChange={(e) => setConfig({ ...config, reply_once_per_contact: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-600">Reply only once per user (prevents duplicate spam & bans)</span>
          </label>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wide">
            Automated Reply Text Message
          </label>
          <textarea
            value={config.automated_message}
            onChange={(e) => setConfig({ ...config, automated_message: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs leading-relaxed"
            placeholder="Type your auto-reply text message here..."
          />
        </div>

        {/* Media Attachments Picker (APK / Files & Voice Notes) */}
        <MediaAttachmentPicker
          filePath={config.mode1_file_path}
          fileName={config.mode1_file_name}
          onFileChange={(path, name) => setConfig({ ...config, mode1_file_path: path, mode1_file_name: name })}
          voicePath={config.mode1_voice_path}
          voiceName={config.mode1_voice_name}
          onVoiceChange={(path, name) => setConfig({ ...config, mode1_voice_path: path, mode1_voice_name: name })}
        />

        <div>
          <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wide">
            Delay before reply (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={config.reply_delay_seconds}
            onChange={(e) => setConfig({ ...config, reply_delay_seconds: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">Recommended: 5–15 seconds to look natural.</p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70">
          <input
            id="reply_once"
            type="checkbox"
            checked={Boolean(config.reply_once_per_contact)}
            onChange={(e) => setConfig({ ...config, reply_once_per_contact: e.target.checked ? 1 : 0 })}
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="reply_once" className="text-xs text-slate-700 cursor-pointer select-none">
            <span className="font-semibold block text-slate-900">Reply only once per contact (Ek contact ko sirf ek baar reply kare)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Agar uncheck rakhoge, to koi bhi dost ya user jab bhi message karega use auto-reply milega (har baar).
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-2 rounded-lg font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          {loading ? 'Saving...' : '💾 Save Mode 1 Settings'}
        </button>
        {saved && <p className="text-xs text-green-600 text-center font-medium">✅ Settings saved successfully</p>}
      </form>

      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={loading || running}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition ${
              running
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {loading ? 'Starting...' : '▶ START Auto-Reply'}
          </button>
          <button
            onClick={handleStop}
            disabled={loading || !running}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition ${
              !running
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
            }`}
          >
            {loading ? 'Stopping...' : '⏹ STOP Auto-Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
