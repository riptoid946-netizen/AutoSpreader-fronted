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
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400">
          Optional attachments (sent as separate messages)
        </span>
        <span className="text-[11px] text-zinc-400">Optional</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File / APK Upload */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-zinc-300">
            <span>File / APK attachment</span>
            {fileName && (
              <button
                type="button"
                onClick={() => onFileChange(null, null)}
                className="text-[11px] font-medium text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </label>
          <p className="mb-2 text-[11px] text-zinc-400">
            Supports .apk, .pdf, .zip, .jpg, documents, etc.
          </p>

          {fileName ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-600/30 bg-emerald-600/10 px-2 py-1.5 text-xs text-emerald-300">
              <span className="truncate font-mono max-w-[200px]" title={fileName}>
                {fileName}
              </span>
              <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                Ready
              </span>
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
                className="w-full rounded-lg border border-dashed border-zinc-700 px-3 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
              >
                {uploadingFile ? 'Uploading file…' : 'Choose APK or file'}
              </button>
            </div>
          )}
          {fileError && <p className="mt-1 text-[11px] font-medium text-red-400">{fileError}</p>}
        </div>

        {/* Voice Note Upload */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-zinc-300">
            <span>Voice note (PTT audio)</span>
            {voiceName && (
              <button
                type="button"
                onClick={() => onVoiceChange(null, null)}
                className="text-[11px] font-medium text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </label>
          <p className="mb-2 text-[11px] text-zinc-400">
            Plays as a WhatsApp microphone voice note (.mp3, .ogg, .m4a)
          </p>

          {voiceName ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300">
              <span className="truncate font-mono max-w-[200px]" title={voiceName}>
                {voiceName}
              </span>
              <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                Ready
              </span>
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
                className="w-full rounded-lg border border-dashed border-zinc-700 px-3 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
              >
                {uploadingVoice ? 'Uploading voice note…' : 'Choose audio / voice note'}
              </button>
            </div>
          )}
          {voiceError && <p className="mt-1 text-[11px] font-medium text-red-400">{voiceError}</p>}
        </div>
      </div>
    </div>
  );
}
