import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  settingsUpdateSchema,
  type Session,
  type SettingsUpdate,
} from "@kisan/contracts";
import { useSettings } from "../../controllers/useSettings";
import { settingsClient } from "../../services/settings";
import { Button, Card, Field, Loading } from "../components/ui";

export function SettingsPage({
  session,
  onSession,
}: {
  session: Session;
  onSession: (value: Session) => void;
}) {
  const { t, i18n } = useTranslation();
  const { settings, setSettings, loading, error, setError } = useSettings();
  const [draft, setDraft] = useState<SettingsUpdate>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (settings)
      setDraft({
        businessName: settings.businessName,
        village: settings.village,
        phone: settings.phone ?? "",
        address: settings.address ?? "",
        ownerDisplayName: settings.ownerDisplayName,
        ownerMobile: settings.ownerMobile ?? "",
        preferredLanguage: settings.preferredLanguage,
        notificationsOptIn: settings.notificationsOptIn,
        textSize: settings.textSize,
      });
  }, [settings]);
  function update<K extends keyof SettingsUpdate>(
    key: K,
    value: SettingsUpdate[K],
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
    setInvalid(false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = settingsUpdateSchema.safeParse(draft);
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setBusy(true);
    try {
      const result = await settingsClient.update(parsed.data);
      setSettings(result);
      setError(false);
      setSaved(true);
      await i18n.changeLanguage(result.preferredLanguage);
      document.documentElement.dataset.textSize = result.textSize.toLowerCase();
      localStorage.setItem("kisan-text-size", result.textSize);
      onSession({
        ...session,
        owner: {
          ...session.owner,
          displayName: result.ownerDisplayName,
          mobile: result.ownerMobile,
          preferredLanguage: result.preferredLanguage,
        },
        business: {
          ...session.business,
          name: result.businessName,
          village: result.village,
          phone: result.phone,
          address: result.address,
        },
      });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-page" aria-labelledby="page-heading">
      <h1 id="page-heading">{t("pages.settings.title")}</h1>
      <p>{t("pages.settings.description")}</p>
      {loading && <Loading />}
      {error && <p role="alert">{t("settings.failed")}</p>}
      {settings && (
        <form onSubmit={(event) => void save(event)} className="settings-form">
          <Card>
            <h2>{t("settings.business")}</h2>
            <div className="settings-fields">
              <Field
                label={t("settings.businessName")}
                value={draft.businessName ?? ""}
                onChange={(event) => update("businessName", event.target.value)}
                required
              />
              <Field
                label={t("settings.village")}
                value={draft.village ?? ""}
                onChange={(event) => update("village", event.target.value)}
                required
              />
              <Field
                label={t("settings.phone")}
                value={draft.phone ?? ""}
                onChange={(event) => update("phone", event.target.value)}
              />
              <Field
                label={t("settings.address")}
                value={draft.address ?? ""}
                onChange={(event) => update("address", event.target.value)}
              />
            </div>
          </Card>
          <Card>
            <h2>{t("settings.owner")}</h2>
            <div className="settings-fields">
              <Field
                label={t("settings.ownerName")}
                value={draft.ownerDisplayName ?? ""}
                onChange={(event) =>
                  update("ownerDisplayName", event.target.value)
                }
                required
              />
              <Field
                label={t("settings.ownerMobile")}
                value={draft.ownerMobile ?? ""}
                onChange={(event) => update("ownerMobile", event.target.value)}
              />
            </div>
          </Card>
          <Card>
            <h2>{t("settings.preferences")}</h2>
            <div className="settings-fields">
              <div className="field">
                <label htmlFor="settings-language">
                  {t("settings.language")}
                </label>
                <select
                  id="settings-language"
                  value={draft.preferredLanguage ?? "en"}
                  onChange={(event) =>
                    update(
                      "preferredLanguage",
                      event.target.value as SettingsUpdate["preferredLanguage"],
                    )
                  }
                >
                  <option value="en">English</option>
                  <option value="te">తెలుగు</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="settings-size">{t("settings.textSize")}</label>
                <select
                  id="settings-size"
                  value={draft.textSize ?? "STANDARD"}
                  onChange={(event) =>
                    update(
                      "textSize",
                      event.target.value as SettingsUpdate["textSize"],
                    )
                  }
                >
                  <option value="STANDARD">{t("settings.standard")}</option>
                  <option value="LARGE">{t("settings.large")}</option>
                </select>
              </div>
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={draft.notificationsOptIn ?? false}
                  onChange={(event) =>
                    update("notificationsOptIn", event.target.checked)
                  }
                />
                {t("settings.notifications")}
              </label>
            </div>
          </Card>
          <Card>
            <h2>{t("settings.billing")}</h2>
            <p>
              {t("settings.prefix")}: <strong>{settings.invoicePrefix}</strong>
            </p>
            <p>
              {t("settings.nextNumber")}:{" "}
              <strong>{settings.nextInvoiceSequence}</strong>
            </p>
            <p>
              {t("settings.timezone")}: <strong>{settings.timezone}</strong>
            </p>
            <p>{t("settings.prefixHelp")}</p>
          </Card>
          {invalid && <p role="alert">{t("settings.invalid")}</p>}
          {saved && <p role="status">{t("settings.saved")}</p>}
          <Button type="submit" busy={busy}>
            {t("settings.save")}
          </Button>
          <Link to="/profile">{t("settings.account")}</Link>
        </form>
      )}
    </section>
  );
}
