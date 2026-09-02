"use client";

import toast, { type Toast } from "react-hot-toast";

export type ToastVariant = "success" | "info" | "error";

export type ToastAction = { label: string; onClick: () => void };

export type CustomToastProps = {
  t: Toast;
  variant: ToastVariant;
  title: string;
  subtitle?: string;
  action?: ToastAction;
};

const VARIANT_STYLE: Record<ToastVariant, { tint: string; icon: string }> = {
  success: { tint: "#ECFDF5", icon: "#10B981" },
  info: { tint: "#EFF6FF", icon: "#3B82F6" },
  error: { tint: "#FEF2F2", icon: "#EF4444" },
};

function VariantIcon({ variant, color }: { variant: ToastVariant; color: string }) {
  if (variant === "success") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
        <path d="M6 10.2l2.5 2.5L14 7.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === "info") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
        <path d="M10 9.2v4.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="6.3" r="1" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 6v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.7" r="1" fill={color} />
    </svg>
  );
}

/**
 * Gradient-tint toast body used with react-hot-toast's toast.custom().
 * Tint fades from the variant color to white by ~65% so it clears the icon.
 */
export default function CustomToast({ t, variant, title, subtitle, action }: CustomToastProps) {
  const { tint, icon } = VARIANT_STYLE[variant];

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: subtitle ? "flex-start" : "center",
        gap: "12px",
        width: "100%",
        minWidth: "360px",
        maxWidth: "400px",
        padding: "16px",
        borderRadius: "12px",
        background: `linear-gradient(to right, ${tint} 0%, #FFFFFF 65%)`,
        boxShadow: "0 4px 16px rgba(10,10,10,0.08), 0 1px 3px rgba(10,10,10,0.06)",
        fontFamily: "var(--font-body)",
        opacity: t.visible ? 1 : 0,
        transition: "opacity 150ms ease",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: subtitle ? "1px" : 0, lineHeight: 0 }}>
        <VariantIcon variant={variant} color={icon} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{title}</p>
        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 400, color: "var(--ink-3)", lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            toast.dismiss(t.id);
          }}
          style={{
            flexShrink: 0,
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--ink)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
