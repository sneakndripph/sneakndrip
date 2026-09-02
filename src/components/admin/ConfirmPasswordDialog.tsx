"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type ConfirmPasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function ConfirmPasswordDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmPasswordDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setMounted(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError("");
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  function handleCancel() {
    setPassword("");
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!password) {
      setError("Password is required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-ink/60 z-40 transition-opacity duration-admin-base ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => { if (!submitting) handleCancel(); }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-password-dialog-title"
        className={`fixed top-1/2 left-1/2 z-50 bg-paper border border-line rounded-md p-6 w-[min(400px,calc(100vw-32px))] shadow-xl transition-all duration-admin-base ease-smooth ${
          mounted
            ? "opacity-100 [transform:translate(-50%,-50%)]"
            : "opacity-0 [transform:translate(-50%,calc(-50%+16px))]"
        }`}
      >
        <p id="confirm-password-dialog-title" className="text-admin-title text-ink mb-2">{title}</p>
        {description && <p className="text-admin text-ink-3 mb-4">{description}</p>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label htmlFor="confirm-password-input" className="block text-admin-eyebrow text-ink-3 mb-1.5">
            Current password
          </label>
          <input
            id="confirm-password-input"
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={submitting}
            placeholder="Enter your password"
            className="w-full px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast disabled:opacity-60"
          />
          {error && <p className="text-admin-sm text-state-error mt-2">{error}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCancel}
              className="bg-transparent text-ink border border-ink text-admin py-2 px-4 rounded-md hover:bg-ink hover:text-paper transition-colors duration-admin-fast disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 text-admin py-2 px-4 rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
