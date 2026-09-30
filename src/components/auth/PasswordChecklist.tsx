import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validation/password";

type Props = {
  /** Referenced by the password input's aria-describedby. */
  id: string;
  password: string;
  /** When provided, adds a "Passwords match" row. */
  confirm?: string;
};

function Row({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-micro ${met ? "text-ink" : "text-ink-3"}`}>
      {met ? (
        <Check className="w-3 h-3 shrink-0 text-state-onhand" aria-hidden="true" />
      ) : (
        <span className="w-3 h-3 shrink-0 flex items-center justify-center" aria-hidden="true">
          <span className="w-1 h-1 rounded-full bg-ink-3" />
        </span>
      )}
      {label}
      <span className="sr-only">{met ? " — met" : " — not met"}</span>
    </li>
  );
}

export default function PasswordChecklist({ id, password, confirm }: Props) {
  return (
    <ul id={id} aria-live="polite" className="mt-2 space-y-0.5">
      {PASSWORD_RULES.map(r => (
        <Row key={r.id} met={r.test(password)} label={r.label} />
      ))}
      {confirm !== undefined && (
        <Row met={confirm.length > 0 && confirm === password} label="Passwords match" />
      )}
    </ul>
  );
}
