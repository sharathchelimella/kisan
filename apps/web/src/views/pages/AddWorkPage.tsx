import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  jobInputSchema,
  type Job,
  type JobInput,
  type JobServiceSummary,
} from "@kisan/contracts";
import { multiplyRate, parseRupees, sumPaise } from "@kisan/domain";
import { useJobOptions } from "../../controllers/useJobOptions";
import { jobClient } from "../../services/jobs";
import { Button, Card, Field, Loading } from "../components/ui";

type DraftLine = {
  serviceId: string;
  quantity: string;
  pricingMode: "DEFAULT_RATE" | "CUSTOM_RATE" | "CUSTOM_TOTAL";
  amount: string;
  reason: string;
};
const blankLine = (): DraftLine => ({
  serviceId: "",
  quantity: "1",
  pricingMode: "DEFAULT_RATE",
  amount: "",
  reason: "",
});
const rupees = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export function AddWorkPage() {
  const { t } = useTranslation();
  const options = useJobOptions();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [farmerId, setFarmerId] = useState(params.get("farmerId") ?? "");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [workDate, setWorkDate] = useState("");
  const [village, setVillage] = useState("");
  const [fieldLocation, setFieldLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<"DRAFT" | "COMPLETED">("COMPLETED");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Job>();
  const [busy, setBusy] = useState(false);
  const farmer = options.farmers.find((item) => item.id === farmerId);
  function service(line: DraftLine): JobServiceSummary | undefined {
    return options.services.find((item) => item.id === line.serviceId);
  }
  function update(index: number, changes: Partial<DraftLine>) {
    setLines((previous) =>
      previous.map((line, position) =>
        position === index ? { ...line, ...changes } : line,
      ),
    );
    setError("");
  }
  function prepare(): JobInput {
    return jobInputSchema.parse({
      farmerId,
      workDate,
      village,
      fieldLocation,
      notes,
      state,
      lines: lines.map((line) => {
        const selected = service(line);
        if (!selected) throw new Error(t("work.chooseService"));
        const common = {
          serviceId: selected.id,
          equipmentIds: selected.equipmentIds,
          unit: selected.unit,
          quantity: line.quantity,
          ...(line.reason && { reason: line.reason }),
        };
        if (line.pricingMode === "CUSTOM_RATE")
          return {
            ...common,
            pricingMode: line.pricingMode,
            agreedRatePaise: parseRupees(line.amount),
          };
        if (line.pricingMode === "CUSTOM_TOTAL")
          return {
            ...common,
            pricingMode: line.pricingMode,
            agreedTotalPaise: parseRupees(line.amount),
          };
        return { ...common, pricingMode: "DEFAULT_RATE" };
      }),
    });
  }
  function total() {
    return sumPaise(
      lines.map((line) => {
        const selected = service(line);
        if (!selected) throw new Error(t("work.chooseService"));
        if (selected.unit === "FIXED" && line.quantity !== "1")
          throw new Error(t("work.invalid"));
        return line.pricingMode === "CUSTOM_TOTAL"
          ? parseRupees(line.amount)
          : multiplyRate(
              line.quantity,
              line.pricingMode === "CUSTOM_RATE"
                ? parseRupees(line.amount)
                : selected.defaultRatePaise,
              selected.unit,
            );
      }),
    );
  }
  function next() {
    try {
      setError("");
      if (step === 0 && !farmer) throw new Error(t("work.chooseFarmer"));
      if (step === 1 && lines.some((line) => !service(line)))
        throw new Error(t("work.chooseService"));
      if (step === 2) {
        prepare();
        total();
      }
      setStep(step + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("work.invalid"));
    }
  }
  async function save() {
    try {
      setBusy(true);
      setError("");
      const input = prepare();
      total();
      setSaved(await jobClient.save(input));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("work.failed"));
    } finally {
      setBusy(false);
    }
  }
  if (options.loading) return <Loading />;
  if (options.error) return <p role="alert">{t("work.failed")}</p>;
  if (saved)
    return (
      <section>
        <h1>{t("work.saved")}</h1>
        <Card className="farmer-card">
          <p>
            {t("work.savedId")} <strong>{saved.id}</strong>
          </p>
          <p>
            {t("work.total")} <strong>{rupees(saved.totalPaise)}</strong>
          </p>
          <Link className="auth-link" to="/jobs">
            {t("work.records")}
          </Link>
        </Card>
      </section>
    );
  return (
    <section>
      <h1>{t("pages.addWork.title")}</h1>
      <p>{t("pages.addWork.description")}</p>
      <ol className="work-steps">
        {["farmer", "service", "details", "review"].map((key, index) => (
          <li key={key} aria-current={index === step ? "step" : undefined}>
            {t(`work.${key}`)}
          </li>
        ))}
      </ol>
      <Card className="farmer-card">
        {step === 0 && (
          <>
            <h2>{t("work.farmer")}</h2>
            <label className="field">
              {t("work.chooseFarmer")}
              <select
                value={farmerId}
                onChange={(event) => {
                  setFarmerId(event.target.value);
                  setVillage(
                    options.farmers.find(
                      (item) => item.id === event.target.value,
                    )?.village ?? "",
                  );
                }}
              >
                <option value="">{t("work.chooseFarmer")}</option>
                {options.farmers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.village}
                  </option>
                ))}
              </select>
            </label>
            {options.farmers.length === 0 && (
              <Link to="/farmers/new">{t("work.addFarmer")}</Link>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <h2>{t("work.service")}</h2>
            {lines.map((line, index) => (
              <div className="work-line" key={index}>
                <label className="field">
                  {t("work.chooseService")}
                  <select
                    value={line.serviceId}
                    onChange={(event) =>
                      update(index, {
                        serviceId: event.target.value,
                        quantity: "1",
                      })
                    }
                  >
                    <option value="">{t("work.chooseService")}</option>
                    {options.services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {t(`catalog.${item.unit}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {service(line) && (
                  <p>
                    {t("work.defaultRate")}{" "}
                    {rupees(service(line)!.defaultRatePaise)}
                  </p>
                )}
                {lines.length > 1 && (
                  <Button
                    onClick={() =>
                      setLines((previous) =>
                        previous.filter((_, position) => position !== index),
                      )
                    }
                  >
                    {t("work.remove")}
                  </Button>
                )}
              </div>
            ))}
            <Button
              onClick={() => setLines((previous) => [...previous, blankLine()])}
            >
              {t("work.addLine")}
            </Button>
            {options.services.length === 0 && (
              <Link to="/machinery?tab=services">{t("work.addService")}</Link>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <h2>{t("work.details")}</h2>
            <Field
              label={t("work.date")}
              type="date"
              value={workDate}
              onChange={(event) => setWorkDate(event.target.value)}
            />
            <Field
              label={t("work.village")}
              value={village}
              onChange={(event) => setVillage(event.target.value)}
            />
            <Field
              label={t("work.location")}
              value={fieldLocation}
              onChange={(event) => setFieldLocation(event.target.value)}
            />
            <Field
              label={t("work.notes")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            {lines.map((line, index) => (
              <div className="work-line" key={index}>
                <h3>{service(line)?.name}</h3>
                <Field
                  label={t("work.quantity")}
                  value={line.quantity}
                  inputMode="decimal"
                  onChange={(event) =>
                    update(index, { quantity: event.target.value })
                  }
                />
                <label className="field">
                  {t("work.pricingMode")}
                  <select
                    value={line.pricingMode}
                    onChange={(event) =>
                      update(index, {
                        pricingMode: event.target
                          .value as DraftLine["pricingMode"],
                        amount: "",
                      })
                    }
                  >
                    {(
                      ["DEFAULT_RATE", "CUSTOM_RATE", "CUSTOM_TOTAL"] as const
                    ).map((mode) => (
                      <option key={mode} value={mode}>
                        {t(`work.${mode}`)}
                      </option>
                    ))}
                  </select>
                </label>
                {line.pricingMode !== "DEFAULT_RATE" && (
                  <Field
                    label={t(
                      line.pricingMode === "CUSTOM_RATE"
                        ? "work.customRate"
                        : "work.customTotal",
                    )}
                    value={line.amount}
                    inputMode="decimal"
                    onChange={(event) =>
                      update(index, { amount: event.target.value })
                    }
                  />
                )}
                <Field
                  label={t("work.reason")}
                  value={line.reason}
                  onChange={(event) =>
                    update(index, { reason: event.target.value })
                  }
                />
              </div>
            ))}
            <label className="field">
              {t("work.state")}
              <select
                value={state}
                onChange={(event) =>
                  setState(event.target.value as typeof state)
                }
              >
                <option value="COMPLETED">{t("work.completed")}</option>
                <option value="DRAFT">{t("work.draft")}</option>
              </select>
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <h2>{t("work.review")}</h2>
            <p>
              {t("work.farmer")} {farmer?.name}
            </p>
            <p>
              {t("work.date")} {workDate}
            </p>
            <ul>
              {lines.map((line, index) => (
                <li key={index}>
                  {service(line)?.name} · {line.quantity} {service(line)?.unit}
                </li>
              ))}
            </ul>
            <p className="catalog-rate">
              {t("work.total")} {rupees(total())}
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="farmer-actions">
          {step > 0 && (
            <Button
              onClick={() => {
                setError("");
                setStep(step - 1);
              }}
            >
              {t("work.back")}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>{t("work.next")}</Button>
          ) : (
            <Button busy={busy} onClick={() => void save()}>
              {t("work.save")}
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}
