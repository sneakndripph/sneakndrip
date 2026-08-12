"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type ConfirmDialogVariant = "default" | "destructive";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
};

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const busy = loading || submitting;

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
    const t = setTimeout(() => cancelRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!busy) onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function handleConfirmClick() {
    const result = onConfirm();
    if (result instanceof Promise) {
      setSubmitting(true);
      try {
        await result;
        setSubmitting(false);
        onClose();
      } catch {
        setSubmitting(false);
      }
    } else {
      onClose();
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-ink/60 z-40 transition-opacity duration-admin-base ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => { if (!busy) onClose(); }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`fixed top-1/2 left-1/2 z-50 bg-paper border border-line rounded-md p-6 w-[min(400px,calc(100vw-32px))] shadow-xl transition-all duration-admin-base ease-smooth ${
          mounted
            ? "opacity-100 [transform:translate(-50%,-50%)]"
            : "opacity-0 [transform:translate(-50%,calc(-50%+16px))]"
        }`}
      >
        <p id="confirm-dialog-title" className="text-admin-title text-ink mb-2">{title}</p>
        {description && <p className="text-admin text-ink-3 mb-6">{description}</p>}
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onClose}
            className="bg-transparent text-ink border border-ink text-admin py-2 px-4 rounded-md hover:bg-ink hover:text-paper transition-colors duration-admin-fast disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirmClick}
            className={`flex items-center gap-1.5 text-admin py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === "destructive"
                ? "bg-state-error text-paper hover:opacity-90 transition-opacity"
                : "bg-ink text-paper hover:bg-ink-2 transition-colors"
            }`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => setState({ options, resolve }));
  }

  function handleClose() {
    state?.resolve(false);
    setState(null);
  }

  function handleConfirm() {
    state?.resolve(true);
    setState(null);
  }

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state?.options.title ?? ""}
      description={state?.options.description}
      confirmLabel={state?.options.confirmLabel}
      cancelLabel={state?.options.cancelLabel}
      variant={state?.options.variant}
    />
  );

  return { confirm, dialog };
}
