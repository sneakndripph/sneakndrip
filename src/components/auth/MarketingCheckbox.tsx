/** Optional marketing opt-in shown at sign-up. Unchecked by default: consent must be an explicit tick. */
export default function MarketingCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 rounded-sm accent-ink"
        />
        <span className="text-micro text-ink-2 leading-relaxed">
          Send me marketing emails (new arrivals, restock alerts, promotions)
          <span className="block text-ink-3 mt-0.5">You can change this anytime in your account settings.</span>
        </span>
      </label>
    </div>
  );
}
