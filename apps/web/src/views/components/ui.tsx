import { useId, type ComponentProps, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Clock,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus } from "@kisan/contracts";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`card ${className}`} {...props} />;
}

export function Button({
  busy,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & { busy?: boolean }) {
  return (
    <button
      {...props}
      type={type}
      className={`button ${props.className ?? ""}`}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy ? <Loading /> : children}
    </button>
  );
}

export function Field({
  label,
  error,
  hint,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const description = [
    hint && `${inputId}-hint`,
    error && `${inputId}-error`,
    props["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        aria-invalid={Boolean(error) || props["aria-invalid"]}
        aria-describedby={description || undefined}
      />
      {hint && <p id={`${inputId}-hint`}>{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const badges = {
  UNPAID: { label: "unpaid", icon: CircleAlert },
  PARTIAL: { label: "partial", icon: Clock },
  PAID: { label: "paid", icon: CircleCheck },
  VOID: { label: "void", icon: CircleMinus },
} as const;

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  const { label, icon: Icon } = badges[status];
  return (
    <span className={`status status-${label}`}>
      <Icon size={16} aria-hidden="true" />
      {t(label)}
    </span>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <span role="status" className="loading">
      <LoaderCircle size={18} aria-hidden="true" />
      {t("loading")}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  description,
  action,
}: {
  icon: LucideIcon;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={36} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <p>{description}</p>
      {action}
    </div>
  );
}
