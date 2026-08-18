"use client";

export default function OrderShippingForm({
  value, onChange, onSubmit, onCancel, submitLabel = "Save Tracking", saving = false, autoFocus = false, helperText,
}: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; onCancel?: () => void;
  submitLabel?: string; saving?: boolean; autoFocus?: boolean; helperText?: string;
}) {
  return (
    <div>
      <label className="block text-admin-eyebrow text-ink-3 mb-1.5">
        Tracking Number <span className="text-state-error">*</span>
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. JRS-123456789"
        autoFocus={autoFocus}
        className="w-full px-3 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast"
      />
      {helperText && <p className="text-admin-micro text-ink-3 mt-1.5">{helperText}</p>}
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={onSubmit} disabled={!value.trim() || saving}
          className="flex-1 py-2.5 text-admin-sm font-semibold rounded-md bg-ink text-paper hover:opacity-90 disabled:opacity-40 transition-opacity duration-admin-fast">
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
