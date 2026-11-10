import { useState, useRef } from 'react';
import { uploadMedia } from '../services/api';

export default function MediaAttachmentPicker({
  filePath,
  fileName,
  onFileChange,
  voicePath,
  voiceName,
  onVoiceChange,
}) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [voiceError, setVoiceError] = useState(null);

  const fileInputRef = useRef(null);
  const voiceInputRef = useRef(null);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setFileError(null);
    try {
      const res = await uploadMedia(file);
      onFileChange(res.filePath, res.fileName);
    } catch (err) {
      setFileError('File upload failed: ' + err.message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleVoiceUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVoice(true);
    setVoiceError(null);
    try {
      const res = await uploadMedia(file);
      onVoiceChange(res.filePath, res.fileName);
    } catch (err) {
      setVoiceError('Voice note upload failed: ' + err.message);
    } finally {
      setUploadingVoice(false);
      if (voiceInputRef.current) voiceInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          📎 Optional Attachments (Sent as separate messages)
        </span>
        <span className="text-[11px] text-slate-400">Optional</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File / APK Upload */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              📦 File / APK Attachment
            </span>
            {fileName && (
              <button
                type="button"
                onClick={() => onFileChange(null, null)}
                className="text-[10px] text-red-500 hover:text-red-700 font-bold"
              >
                Remove
              </button>
            )}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Supports .apk, .pdf, .zip, .jpg, documents, etc.
          </p>

          {fileName ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-800">
              <span className="truncate font-mono font-medium max-w-[200px]" title={fileName}>
                📁 {fileName}
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Ready</span>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <button
                type="button"
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 px-3 border border-dashed border-slate-300 rounded text-xs text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition text-center"
              >
                {uploadingFile ? 'Uploading APK / File...' : '+ Choose APK or File'}
              </button>
            </div>
          )}
          {fileError && <p className="text-[11px] text-red-500 mt-1">{fileError}</p>}
        </div>

        {/* Voice Note Upload */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              🎙️ Voice Note (PTT Audio)
            </span>
            {voiceName && (
              <button
                type="button"
                onClick={() => onVoiceChange(null, null)}
                className="text-[10px] text-red-500 hover:text-red-700 font-bold"
              >
                Remove
              </button>
            )}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Plays as a WhatsApp microphone voice note (.mp3, .ogg, .m4a)
          </p>

          {voiceName ? (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded p-2 text-xs text-purple-800">
              <span className="truncate font-mono font-medium max-w-[200px]" title={voiceName}>
                🎵 {voiceName}
              </span>
              <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Ready</span>
            </div>
          ) : (
            <div>
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*,.mp3,.ogg,.wav,.m4a"
                onChange={handleVoiceUpload}
                className="hidden"
                id="voice-upload-input"
              />
              <button
                type="button"
                disabled={uploadingVoice}
                onClick={() => voiceInputRef.current?.click()}
                className="w-full py-1.5 px-3 border border-dashed border-slate-300 rounded text-xs text-slate-600 hover:border-purple-400 hover:bg-purple-50/30 transition text-center"
              >
                {uploadingVoice ? 'Uploading Voice Note...' : '+ Choose Audio / Voice Note'}
              </button>
            </div>
          )}
          {voiceError && <p className="text-[11px] text-red-500 mt-1">{voiceError}</p>}
        </div>
      </div>
    </div>
  );
}

