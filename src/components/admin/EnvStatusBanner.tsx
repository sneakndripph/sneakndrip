"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function EnvStatusBanner() {
  const [missingOptional, setMissingOptional] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/env-status")
      .then(r => r.json())
      .then(d => setMissingOptional(d.missing_optional ?? []))
      .catch(err => console.error("[EnvStatusBanner] failed to fetch env status:", err));
  }, []);

  if (missingOptional.length === 0) return null;

  return (
    <div className="bg-state-preorder/10 border-l-4 border-state-preorder text-ink px-4 py-3 mb-6 flex gap-3">
      <AlertTriangle size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" />
      <div>
        <p className="text-admin-sm">
          Missing optional env vars: {missingOptional.join(", ")}
        </p>
        <p className="text-admin-sm text-ink/60">
          Some features may be disabled. See .env.example for details.
        </p>
      </div>
    </div>
  );
}
