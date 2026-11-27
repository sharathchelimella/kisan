import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import { Button, Field } from "../ui";
import {
  ConfirmDialog,
  EmptyState,
  FilterBar,
  InlineMessage,
  MoneyText,
  SearchInput,
  Skeleton,
  StatusBadge,
  Toast,
} from ".";

export function QualityFixture() {
  const { t, i18n } = useTranslation("quality");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <main className="quality-fixture">
      <header className="quality-header">
        <div>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <div className="field">
          <label htmlFor="quality-language">{t("language")}</label>
          <select
            id="quality-language"
            value={i18n.language}
            onChange={(event) => void i18n.changeLanguage(event.target.value)}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </header>
      <section className="quality-grid" aria-label={t("examples")}>
        <div className="card quality-card">
          <h2>{t("financial")}</h2>
          <p>
            {t("amount")}: <MoneyText amountPaise={595000} />
          </p>
          <div className="quality-badges">
            <StatusBadge status="UNPAID" />
            <StatusBadge status="PARTIAL" />
            <StatusBadge status="PAID" />
            <StatusBadge status="VOID" />
          </div>
        </div>
        <div className="card quality-card">
          <h2>{t("search")}</h2>
          <FilterBar
            label={t("filters")}
            clearLabel={t("clear")}
            onClear={() => setQuery("")}
          >
            <SearchInput
              label={t("searchLabel")}
              value={query}
              onChange={setQuery}
            />
          </FilterBar>
          <EmptyState icon={Inbox} description={t("empty")} />
        </div>
        <div className="card quality-card">
          <h2>{t("form")}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setError(true);
            }}
          >
            <Field
              label={t("name")}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(false);
              }}
              error={error ? t("saveError") : undefined}
            />
            <Button type="submit">{t("save")}</Button>
          </form>
          {error && <InlineMessage kind="error">{t("retry")}</InlineMessage>}
        </div>
        <div className="card quality-card">
          <h2>{t("feedback")}</h2>
          <Skeleton label={t("loading")} />
          <Button onClick={() => setDialogOpen(true)}>{t("openDialog")}</Button>
          {confirmed && (
            <Toast
              kind="success"
              dismissLabel={t("dismiss")}
              onDismiss={() => setConfirmed(false)}
            >
              {t("confirmed")}
            </Toast>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={dialogOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        cancelLabel={t("cancel")}
        confirmLabel={t("confirm")}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          setConfirmed(true);
        }}
      />
    </main>
  );
}
