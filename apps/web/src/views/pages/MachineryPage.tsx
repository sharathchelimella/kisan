import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Tractor, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  catalogQuerySchema,
  equipmentWriteSchema,
  serviceWriteSchema,
  pricingUnitSchema,
  type Equipment,
  type EquipmentInput,
  type Service,
  type ServiceInput,
} from "@kisan/contracts";
import { parseRupees } from "@kisan/domain";
import { useCatalog, useEquipmentOptions } from "../../controllers/useCatalog";
import { catalogClient } from "../../services/catalog";
import { Button, Card, Field, Loading } from "../components/ui";

const kinds = [
  "TRACTOR",
  "PLOUGH",
  "ROTAVATOR",
  "TROLLEY",
  "HARVESTER",
  "CUSTOM",
] as const;
type Editor =
  | { type: "equipment"; item?: Equipment }
  | { type: "services"; item?: Service };

function EquipmentEditor({
  item,
  close,
}: {
  item?: Equipment;
  close: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm<EquipmentInput>({
    resolver: zodResolver(equipmentWriteSchema),
    defaultValues: {
      name: item?.name ?? "",
      kind: item?.kind ?? "TRACTOR",
      serialOrRegistration: item?.serialOrRegistration ?? "",
      active: item?.active ?? true,
    },
  });
  const [error, setError] = useState(false);
  const submit = form.handleSubmit(async (input) => {
    setError(false);
    try {
      await catalogClient.saveEquipment(input, item?.id);
      close();
    } catch {
      setError(true);
    }
  });
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <Field
        label={t("catalog.name")}
        {...form.register("name")}
        error={form.formState.errors.name ? t("auth.checkField") : undefined}
      />
      <label className="field">
        {t("catalog.kind")}
        <select {...form.register("kind")}>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {t(`catalog.${kind}`)}
            </option>
          ))}
          {item && !kinds.some((kind) => kind === item.kind) && (
            <option value={item.kind}>{item.kind}</option>
          )}
        </select>
      </label>
      <Field
        label={t("catalog.registration")}
        {...form.register("serialOrRegistration")}
        error={
          form.formState.errors.serialOrRegistration
            ? t("auth.checkField")
            : undefined
        }
      />
      <label className="farmer-checkbox">
        <input type="checkbox" {...form.register("active")} />
        {t("catalog.active")}
      </label>
      {error && <p role="alert">{t("catalog.error")}</p>}
      <div className="farmer-actions">
        <Button type="submit" busy={form.formState.isSubmitting}>
          {t("farmers.save")}
        </Button>
        <Button disabled={form.formState.isSubmitting} onClick={close}>
          {t("farmers.cancel")}
        </Button>
      </div>
    </form>
  );
}

function ServiceEditor({ item, close }: { item?: Service; close: () => void }) {
  const { t } = useTranslation();
  const options = useEquipmentOptions();
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceWriteSchema),
    defaultValues: {
      name: item?.name ?? "",
      unit: item?.unit ?? "HOUR",
      defaultRatePaise: item?.defaultRatePaise ?? 0,
      equipmentIds: item?.equipmentIds ?? [],
      active: item?.active ?? true,
    },
  });
  const initialRate = item
    ? `${Math.floor(item.defaultRatePaise / 100)}.${String(item.defaultRatePaise % 100).padStart(2, "0")}`
    : "";
  const [rate, setRate] = useState(initialRate);
  const [rateError, setRateError] = useState(false);
  const [error, setError] = useState(false);
  const selected = form.watch("equipmentIds");
  const submit = form.handleSubmit(async (input) => {
    setError(false);
    let defaultRatePaise: number;
    try {
      defaultRatePaise = parseRupees(rate);
    } catch {
      setRateError(true);
      return;
    }
    setRateError(false);
    try {
      await catalogClient.saveService({ ...input, defaultRatePaise }, item?.id);
      close();
    } catch {
      setError(true);
    }
  });
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <Field
        label={t("catalog.name")}
        {...form.register("name")}
        error={form.formState.errors.name ? t("auth.checkField") : undefined}
      />
      <label className="field">
        {t("catalog.unit")}
        <select {...form.register("unit")}>
          {pricingUnitSchema.options.map((unit) => (
            <option key={unit} value={unit}>
              {t(`catalog.${unit}`)}
            </option>
          ))}
        </select>
      </label>
      <Field
        label={t("catalog.rate")}
        inputMode="decimal"
        value={rate}
        onChange={(event) => {
          setRate(event.target.value);
          setRateError(false);
        }}
        error={rateError ? t("catalog.invalidRate") : undefined}
      />
      <fieldset className="catalog-equipment">
        <legend>{t("catalog.package")}</legend>
        {options.loading && <Loading />}
        {options.error && <p role="alert">{t("catalog.error")}</p>}
        {!options.loading && !options.error && options.items.length === 0 && (
          <p>{t("catalog.noEquipment")}</p>
        )}
        {options.items.map((equipment) => (
          <label className="farmer-checkbox" key={equipment.id}>
            <input
              type="checkbox"
              checked={selected.includes(equipment.id)}
              onChange={(event) =>
                form.setValue(
                  "equipmentIds",
                  event.target.checked
                    ? [...selected, equipment.id]
                    : selected.filter((id) => id !== equipment.id),
                  { shouldValidate: true },
                )
              }
            />
            {equipment.name}
            {!equipment.active && " · " + t("farmers.archived")}
          </label>
        ))}
        {form.formState.errors.equipmentIds && (
          <p role="alert">{t("catalog.selectionError")}</p>
        )}
      </fieldset>
      <label className="farmer-checkbox">
        <input type="checkbox" {...form.register("active")} />
        {t("catalog.active")}
      </label>
      {error && <p role="alert">{t("catalog.error")}</p>}
      <div className="farmer-actions">
        <Button
          type="submit"
          disabled={options.loading || options.error}
          busy={form.formState.isSubmitting}
        >
          {t("farmers.save")}
        </Button>
        <Button disabled={form.formState.isSubmitting} onClick={close}>
          {t("farmers.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function MachineryPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "services" ? "services" : "equipment";
  const parsed = catalogQuerySchema.safeParse(Object.fromEntries(params));
  const query = parsed.success ? parsed.data : catalogQuerySchema.parse({});
  const state = useCatalog(query, tab);
  const [editor, setEditor] = useState<Editor>();
  const [archive, setArchive] = useState<Equipment | Service>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  function close() {
    setEditor(undefined);
    state.refresh();
  }
  function navigate(values: Record<string, string>) {
    setParams({ ...Object.fromEntries(params), page: "1", ...values });
    setEditor(undefined);
    setArchive(undefined);
    setFailed(false);
  }
  async function confirmArchive() {
    if (!archive) return;
    setBusy(true);
    setFailed(false);
    try {
      if ("kind" in archive) {
        const { id, ...input } = archive;
        await catalogClient.saveEquipment({ ...input, active: false }, id);
      } else {
        const { id, ...input } = archive;
        await catalogClient.saveService({ ...input, active: false }, id);
      }
      setArchive(undefined);
      state.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>{t("pages.machinery.title")}</h1>
      <p>{t("pages.machinery.description")}</p>
      <div className="catalog-tabs" aria-label={t("pages.machinery.title")}>
        <Button
          aria-pressed={tab === "equipment"}
          onClick={() => navigate({ tab: "equipment" })}
        >
          {t("catalog.equipment")}
        </Button>
        <Button
          aria-pressed={tab === "services"}
          onClick={() => navigate({ tab: "services" })}
        >
          {t("catalog.services")}
        </Button>
      </div>
      <p className="catalog-purpose">
        {t(
          tab === "equipment"
            ? "catalog.equipmentPurpose"
            : "catalog.servicePurpose",
        )}
      </p>
      {editor ? (
        <Card className="farmer-card">
          <h2>
            {t(
              editor.item
                ? "catalog.edit"
                : editor.type === "equipment"
                  ? "catalog.addEquipment"
                  : "catalog.addService",
            )}
          </h2>
          {editor.type === "equipment" ? (
            <EquipmentEditor item={editor.item} close={close} />
          ) : (
            <ServiceEditor item={editor.item} close={close} />
          )}
        </Card>
      ) : (
        <>
          <div className="farmer-heading">
            <Button
              onClick={() =>
                setEditor(
                  tab === "equipment"
                    ? { type: "equipment" }
                    : { type: "services" },
                )
              }
            >
              {t(
                tab === "equipment"
                  ? "catalog.addEquipment"
                  : "catalog.addService",
              )}
            </Button>
            <label className="farmer-checkbox">
              <input
                type="checkbox"
                checked={query.active === "false"}
                onChange={(event) =>
                  navigate({ active: event.target.checked ? "false" : "true" })
                }
              />
              {t("farmers.archived")}
            </label>
          </div>
          {archive && (
            <Card className="farmer-card">
              <p>{t("catalog.confirmArchive", { name: archive.name })}</p>
              <div className="farmer-actions">
                <Button busy={busy} onClick={() => void confirmArchive()}>
                  {t("farmers.archive")}
                </Button>
                <Button disabled={busy} onClick={() => setArchive(undefined)}>
                  {t("farmers.cancel")}
                </Button>
              </div>
              {failed && <p role="alert">{t("catalog.error")}</p>}
            </Card>
          )}
          {state.loading && <Loading />}
          {state.error && (
            <div role="alert">
              <p>{t("catalog.error")}</p>
              <Button onClick={state.refresh}>{t("auth.retry")}</Button>
            </div>
          )}
          {!state.loading && !state.error && state.items.length === 0 && (
            <Card className="farmer-card">{t("catalog.empty")}</Card>
          )}
          <ul className="catalog-grid">
            {state.items.map((item) => (
              <li key={item.id}>
                <Card className="catalog-card">
                  <div className="catalog-card-title">
                    {"kind" in item ? (
                      <Tractor size={32} aria-hidden="true" />
                    ) : (
                      <Wrench size={32} aria-hidden="true" />
                    )}
                    <h2>{item.name}</h2>
                  </div>
                  {"kind" in item ? (
                    <>
                      <p>
                        {kinds.some((kind) => kind === item.kind)
                          ? t(`catalog.${item.kind as (typeof kinds)[number]}`)
                          : item.kind}
                      </p>
                      {item.serialOrRegistration && (
                        <p>{item.serialOrRegistration}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="catalog-rate">
                        {new Intl.NumberFormat(i18n.language, {
                          style: "currency",
                          currency: "INR",
                        }).format(item.defaultRatePaise / 100)}{" "}
                        <span>· {t(`catalog.${item.unit}`)}</span>
                      </p>
                      <p>
                        {t("catalog.equipmentCount", {
                          count: item.equipmentIds.length,
                        })}
                      </p>
                    </>
                  )}
                  {!item.active && <p>{t("farmers.archived")}</p>}
                  <div className="farmer-actions">
                    <Button
                      onClick={() =>
                        setEditor(
                          "kind" in item
                            ? { type: "equipment", item }
                            : { type: "services", item },
                        )
                      }
                    >
                      {t("catalog.edit")}
                    </Button>
                    {item.active && (
                      <Button
                        onClick={() => {
                          setArchive(item);
                          setFailed(false);
                        }}
                      >
                        {t("farmers.archive")}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {!state.loading && !state.error && (
            <nav
              className="farmer-pagination"
              aria-label={t("catalog.pagination")}
            >
              <Button
                disabled={query.page <= 1}
                onClick={() => navigate({ page: String(query.page - 1) })}
              >
                {t("farmers.previous")}
              </Button>
              <span>
                {t("farmers.page", {
                  page: query.page,
                  total: Math.max(1, Math.ceil(state.total / query.pageSize)),
                })}
              </span>
              <Button
                disabled={query.page * query.pageSize >= state.total}
                onClick={() => navigate({ page: String(query.page + 1) })}
              >
                {t("farmers.next")}
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
