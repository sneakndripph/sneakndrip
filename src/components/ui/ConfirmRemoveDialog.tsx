"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

export default function ConfirmRemoveDialog({
  open,
  productName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-ink/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-modal="true"
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(380px,calc(100vw-32px))] bg-paper border border-line rounded-md p-6 shadow-xl outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Title className="text-body font-display font-medium text-ink mb-2">
            Remove this item?
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-body-sm text-ink-3 mb-6">
            This will remove {productName} from your cart.
          </DialogPrimitive.Description>
          <div className="flex justify-end gap-2">
            <DialogPrimitive.Close className="text-body-sm py-2 px-4 rounded-md border border-line text-ink hover:bg-paper-2 transition-colors">
              Cancel
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="text-body-sm py-2 px-4 rounded-md bg-state-error text-paper hover:opacity-90 transition-opacity"
            >
              Remove
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
