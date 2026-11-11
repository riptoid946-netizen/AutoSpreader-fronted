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
    <section className="panel" aria-labelledby="mode1-heading">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 id="mode1-heading" className="panel-title flex items-center gap-2">
          <span className="num-chip">1</span>
          Mode 1: Same Message Auto-Reply
        </h2>
        <span className={`chip ${running ? 'chip-success' : 'chip-idle'}`}>
          <span className={`status-dot ${running ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
          {running ? 'Running' : 'Inactive'}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="panel-soft space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.mode1_enabled === 1}
              onChange={(e) => setConfig({ ...config, mode1_enabled: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
            />
            <span className="text-xs font-medium text-zinc-300">Enable Mode 1 Auto-Reply</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.reply_once_per_contact === 1}
              onChange={(e) => setConfig({ ...config, reply_once_per_contact: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
            />
            <span className="text-xs text-zinc-400">Reply only once per user (prevents duplicate spam &amp; bans)</span>
          </label>
        </div>

        <div>
          <label className="label">Automated reply text message</label>
          <textarea
            value={config.automated_message}
            onChange={(e) => setConfig({ ...config, automated_message: e.target.value })}
            rows={3}
            className="field-sm leading-relaxed"
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
          <label className="label">Delay before reply (seconds)</label>
          <input
            type="number"
            min="0"
            value={config.reply_delay_seconds}
            onChange={(e) => setConfig({ ...config, reply_delay_seconds: Math.max(0, parseInt(e.target.value) || 0) })}
            className="field-sm sm:w-48"
          />
          <p className="hint">Recommended: 5–15 seconds to look natural.</p>
        </div>

        <div className="flex items-start gap-2.5 panel-soft">
          <input
            id="reply_once"
            type="checkbox"
            checked={Boolean(config.reply_once_per_contact)}
            onChange={(e) => setConfig({ ...config, reply_once_per_contact: e.target.checked ? 1 : 0 })}
            className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 cursor-pointer"
          />
          <label htmlFor="reply_once" className="text-xs text-zinc-400 cursor-pointer select-none">
            <span className="font-medium block text-zinc-200">Reply only once per contact (Ek contact ko sirf ek baar reply kare)</span>
            <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
              Agar uncheck rakhoge, to koi bhi dost ya user jab bhi message karega use auto-reply milega (har baar).
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Saving…' : 'Save Mode 1 Settings'}
        </button>
        {saved && <p className="text-xs text-emerald-500 text-center font-medium">Settings saved successfully</p>}
      </form>

      <div className="mt-5 border-t border-zinc-800 pt-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleStart}
            disabled={loading || running}
            className={`sm:flex-1 ${running ? 'btn-disabled' : 'btn-primary'}`}
          >
            {loading ? 'Starting…' : 'Start Auto-Reply'}
          </button>
          <button
            onClick={handleStop}
            disabled={loading || !running}
            className={`sm:flex-1 ${!running ? 'btn-disabled' : 'btn-danger'}`}
          >
            {loading ? 'Stopping…' : 'Stop Auto-Reply'}
          </button>
        </div>
      </div>
    </section>
  );
}
