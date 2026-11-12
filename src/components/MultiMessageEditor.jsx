export default function MultiMessageEditor({
  messages = [''],
  onChange,
  disabled = false,
  label = 'Text messages',
  placeholder = 'Type message text here...',
}) {
  const list = Array.isArray(messages) && messages.length > 0 ? messages : [''];
  const nonEmptyCount = list.filter((m) => String(m || '').trim().length > 0).length;

  function updateItem(index, value) {
    const next = [...list];
    next[index] = value;
    onChange(next);
  }

  function addItem() {
    if (disabled) return;
    onChange([...list, '']);
  }

  function removeItem(index) {
    if (disabled) return;
    if (list.length <= 1) {
      onChange(['']);
      return;
    }
    onChange(list.filter((_, idx) => idx !== index));
  }

  function moveItem(index, delta) {
    if (disabled) return;
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="label mb-0">{label}</label>
        <span className="chip chip-info">
          {nonEmptyCount} {nonEmptyCount === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <div className="space-y-2.5">
        {list.map((text, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Message {idx + 1}
              </span>
              <div className="flex items-center gap-1.5">
                {list.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={disabled || idx === 0}
                      title="Move up"
                      className="rounded border border-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={disabled || idx === list.length - 1}
                      title="Move down"
                      className="rounded border border-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </>
                )}
                {(list.length > 1 || String(text || '').length > 0) && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={disabled}
                    className="rounded border border-zinc-800 px-2 py-0.5 text-[11px] font-medium text-red-400 hover:border-red-600/50 hover:bg-red-600/10 disabled:opacity-40"
                  >
                    {list.length > 1 ? 'Remove' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => updateItem(idx, e.target.value)}
              disabled={disabled}
              rows={2}
              className="field-sm leading-relaxed"
              placeholder={
                idx === 0
                  ? placeholder
                  : `Type message #${idx + 1} (alag WhatsApp message me jayega)...`
              }
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10 disabled:opacity-40"
      >
        <span>+</span>
        <span>Add Another Message</span>
      </button>

      <p className="hint">
        Har box WhatsApp par alag-alag message bubble ban kar 1-by-1 natural typing delay ke saath send hoga.
      </p>
    </div>
  );
}
