"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import PhAddressSelect from "@/components/ui/PhAddressSelect";

export interface AddressFormValues {
  label: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressFormProps {
  initialData?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
  lockDefault?: boolean;
}

const LABEL_PRESETS = ["Home", "Office"];
const inputCls = "w-full px-4 py-3 text-sm focus:outline-none transition-colors bg-paper text-ink border focus:border-ink";

export default function AddressForm({
  initialData, onSubmit, onCancel, submitting = false, submitLabel = "Save Address", lockDefault = false,
}: AddressFormProps) {
  const [form, setForm] = useState<AddressFormValues>({
    label: initialData?.label ?? "Home",
    street: initialData?.street ?? "",
    barangay: initialData?.barangay ?? "",
    city: initialData?.city ?? "",
    province: initialData?.province ?? "",
    postal_code: initialData?.postal_code ?? "",
    is_default: initialData?.is_default ?? false,
  });
  const [showErrors, setShowErrors] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || !form.street.trim() || !form.province || !form.city || !form.barangay || !form.postal_code.trim()) {
      setShowErrors(true);
      return;
    }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
          Label <span className="text-state-error">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          {LABEL_PRESETS.map(preset => (
            <button key={preset} type="button"
              onClick={() => setForm(f => ({ ...f, label: preset }))}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                form.label === preset ? "bg-ink text-paper border-ink" : "bg-paper-2 text-ink-2 border-line"
              }`}>
              {preset}
            </button>
          ))}
        </div>
        <input
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder="e.g. Home, Office, Mom's House"
          className={`${inputCls} ${showErrors && !form.label.trim() ? "border-state-error" : "border-line"}`}
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
          Street Address <span className="text-state-error">*</span>
        </label>
        <input
          value={form.street}
          onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
          placeholder="123 Rizal St."
          className={`${inputCls} ${showErrors && !form.street.trim() ? "border-state-error" : "border-line"}`}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PhAddressSelect
          province={form.province}
          city={form.city}
          barangay={form.barangay}
          onProvinceChange={v => setForm(f => ({ ...f, province: v }))}
          onCityChange={v => setForm(f => ({ ...f, city: v }))}
          onBarangayChange={v => setForm(f => ({ ...f, barangay: v }))}
          showErrors={showErrors}
        />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
            Postal Code <span className="text-state-error">*</span>
          </label>
          <input
            value={form.postal_code}
            onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
            placeholder="1630"
            className={`${inputCls} ${showErrors && !form.postal_code.trim() ? "border-state-error" : "border-line"}`}
          />
          {showErrors && !form.postal_code.trim() && (
            <p className="mt-1 text-[11px] font-semibold text-state-error">Postal code is required</p>
          )}
        </div>
      </div>

      <label className={`flex items-center gap-2 ${lockDefault ? "opacity-50" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          checked={form.is_default}
          disabled={lockDefault}
          onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
          className="w-4 h-4"
        />
        <span className="text-xs font-semibold text-ink-2">
          {lockDefault ? "Default address (only one saved)" : "Set as default address"}
        </span>
      </label>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-ink text-paper">
          <Save className="w-4 h-4" />
          {submitting ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-3 text-xs font-bold border border-line text-ink-2">
          Cancel
        </button>
      </div>
    </form>
  );
}
