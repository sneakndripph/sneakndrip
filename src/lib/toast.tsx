import toast from "react-hot-toast";
import CustomToast, { type ToastAction, type ToastVariant } from "@/components/ui/CustomToast";

export type ToastOptions = {
  subtitle?: string;
  action?: ToastAction;
  duration?: number;
};

function show(variant: ToastVariant, title: string, options?: ToastOptions) {
  return toast.custom(
    t => (
      <CustomToast
        t={t}
        variant={variant}
        title={title}
        subtitle={options?.subtitle}
        action={options?.action}
      />
    ),
    { duration: options?.duration }
  );
}

export function toastSuccess(title: string, options?: ToastOptions) {
  return show("success", title, options);
}

export function toastError(title: string, options?: ToastOptions) {
  return show("error", title, options);
}

export function toastInfo(title: string, options?: ToastOptions) {
  return show("info", title, options);
}
