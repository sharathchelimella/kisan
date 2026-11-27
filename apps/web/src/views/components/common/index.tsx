import {
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import "./quality.css";

export { EmptyState, StatusBadge } from "../ui";

export function MoneyText({ amountPaise }: { amountPaise: number }) {
  const { i18n } = useTranslation();
  if (!Number.isSafeInteger(amountPaise))
    throw new Error("Invalid paise amount");
  const locale =
    { en: "en-IN", te: "te-IN", hi: "hi-IN" }[i18n.language] ?? "en-IN";
  return (
    <span className="money-text">
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "INR",
      }).format(amountPaise / 100)}
    </span>
  );
}

export function SearchInput({
  label,
  value,
  onChange,
  id,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "type">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="field common-search">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function FilterBar({
  label,
  children,
  onClear,
  clearLabel,
}: {
  label: string;
  children: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <fieldset className="common-filter-bar">
      <legend>{label}</legend>
      <div className="common-filter-content">
        {children}
        {onClear && (
          <button type="button" className="common-secondary" onClick={onClear}>
            {clearLabel}
          </button>
        )}
      </div>
    </fieldset>
  );
}

export function Skeleton({
  label,
  lines = 3,
}: {
  label: string;
  lines?: number;
}) {
  return (
    <div className="common-skeleton" role="status" aria-label={label}>
      {Array.from({ length: Math.max(1, Math.min(lines, 8)) }, (_, index) => (
        <span key={index} aria-hidden="true" />
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={dialogRef}
      className="common-dialog"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id={headingId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <div className="common-dialog-actions">
        <button type="button" className="common-secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className="button"
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function InlineMessage({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      className={`common-message common-message-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export function Toast({
  kind,
  children,
  dismissLabel,
  onDismiss,
}: {
  kind: "error" | "success";
  children: ReactNode;
  dismissLabel: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`common-toast common-message-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span>{children}</span>
      <button
        type="button"
        className="common-secondary"
        aria-label={dismissLabel}
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
