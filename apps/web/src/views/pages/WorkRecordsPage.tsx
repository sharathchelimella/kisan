import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { jobQuerySchema, type JobQuery } from "@kisan/contracts";
import { useJobRecord, useJobRecords } from "../../controllers/useJobRecords";
import { jobReadClient } from "../../services/job-records";
import { invoiceClient } from "../../services/invoices";
import { Button, Card, Field, Loading } from "../components/ui";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    paise / 100,
  );
export function WorkRecordsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const query = jobQuerySchema.parse(Object.fromEntries(params));
  const { page, error, loading } = useJobRecords(query);
  function update(key: keyof JobQuery, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }
  return (
    <section className="records-page" aria-labelledby="page-heading">
      <h1 id="page-heading">{t("pages.jobs.title")}</h1>
      <p>{t("pages.jobs.description")}</p>
      <Card className="records-filters">
        <Field
          label={t("records.search")}
          value={query.q ?? ""}
          onChange={(event) => update("q", event.target.value)}
        />
        <Field
          label={t("work.date")}
          type="date"
          value={query.from ?? ""}
          onChange={(event) => update("from", event.target.value)}
        />
        <Field
          label={t("records.to")}
          type="date"
          value={query.to ?? ""}
          onChange={(event) => update("to", event.target.value)}
        />
        <Field
          label={t("work.village")}
          value={query.village ?? ""}
          onChange={(event) => update("village", event.target.value)}
        />
        <Field
          label={t("records.farmerId")}
          value={query.farmerId ?? ""}
          onChange={(event) => update("farmerId", event.target.value)}
        />
        <Field
          label={t("records.serviceId")}
          value={query.serviceId ?? ""}
          onChange={(event) => update("serviceId", event.target.value)}
        />
        <Field
          label={t("records.equipmentId")}
          value={query.equipmentId ?? ""}
          onChange={(event) => update("equipmentId", event.target.value)}
        />
        <div className="field">
          <label htmlFor="record-state">{t("work.state")}</label>
          <select
            id="record-state"
            value={query.state ?? ""}
            onChange={(event) => update("state", event.target.value)}
          >
            <option value="">{t("records.all")}</option>
            {["DRAFT", "COMPLETED", "BILLED", "CANCELLED"].map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="record-sort">{t("records.sort")}</label>
          <select
            id="record-sort"
            value={query.sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="newest">{t("records.newest")}</option>
            <option value="oldest">{t("records.oldest")}</option>
          </select>
        </div>
      </Card>
      {loading && <Loading />}
      {error && <p role="alert">{t("records.loadError")}</p>}
      {page && !loading && (
        <>
          <p>{t("records.count", { count: page.total })}</p>
          {page.items.length === 0 ? (
            <Card>{t("records.empty")}</Card>
          ) : (
            <div className="records-list">
              {page.items.map((job) => (
                <Card key={job.id} className="record-card">
                  <div>
                    <h2>{job.farmerName}</h2>
                    <p>
                      {job.workDate} · {job.village}
                    </p>
                    <p>{job.services.join(", ")}</p>
                    <small>
                      {t("work.savedId")}: {job.id}
                    </small>
                  </div>
                  <div>
                    <strong>{money(job.totalPaise)}</strong>
                    <p>{job.state}</p>
                    <Link to={`/jobs/${job.id}`}>{t("records.view")}</Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="record-pagination">
            <Button
              disabled={query.page <= 1}
              onClick={() => update("page", String(query.page - 1))}
            >
              {t("work.back")}
            </Button>
            <span>
              {query.page} /{" "}
              {Math.max(1, Math.ceil(page.total / query.pageSize))}
            </span>
            <Button
              disabled={query.page * query.pageSize >= page.total}
              onClick={() => update("page", String(query.page + 1))}
            >
              {t("work.next")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
export function WorkRecordPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const { record, loading, error, setRecord } = useJobRecord(id);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [issuedId, setIssuedId] = useState<string | null>(null);
  async function issue() {
    try {
      const invoice = await invoiceClient.issue(id);
      setIssuedId(invoice.id);
      setActionError(false);
    } catch {
      setActionError(true);
    }
  }
  async function cancel() {
    setBusy(true);
    try {
      setRecord(await jobReadClient.cancel(id, reason));
      setActionError(false);
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="records-page" aria-labelledby="page-heading">
      <h1 id="page-heading">{t("records.detail")}</h1>
      <Link to="/jobs">{t("records.back")}</Link>
      {loading && <Loading />}
      {error && <p role="alert">{t("records.loadError")}</p>}
      {!loading && !record && !error && <p>{t("records.notFound")}</p>}
      {record && (
        <>
          <Card>
            <p>
              {t("work.savedId")}: {record.id}
            </p>
            <p>
              {record.workDate} · {record.village} · {record.state}
            </p>
            <p>
              {t("records.farmerId")}: {record.farmerId}
            </p>
            {record.fieldLocation && <p>{record.fieldLocation}</p>}
            {record.notes && <p>{record.notes}</p>}
          </Card>
          <div className="records-list">
            {record.lines.map((line) => (
              <Card key={line.lineId}>
                <h2>{line.serviceNameSnapshot}</h2>
                <p>
                  {line.quantity} {line.unit} · {line.pricingMode}
                </p>
                <p>{money(line.totalPaise)}</p>
              </Card>
            ))}
          </div>
          <h2>
            {t("work.total")}: {money(record.totalPaise)}
          </h2>
          {record.state === "COMPLETED" && !record.invoiceId && (
            <Button onClick={issue}>{t("billing.issue")}</Button>
          )}
          {(issuedId || record.invoiceId) && (
            <Link to={`/invoices/${issuedId ?? record.invoiceId}`}>
              {t("billing.view")}
            </Link>
          )}
          {record.revisions.length > 0 && (
            <Card>
              <h2>{t("records.history")}</h2>
              {record.revisions.map((revision, index) => (
                <p key={index}>
                  {revision.action} · {revision.at} · {revision.reason}
                </p>
              ))}
            </Card>
          )}
          {["DRAFT", "COMPLETED"].includes(record.state) &&
            !record.invoiceId && (
              <Card>
                <h2>{t("records.cancel")}</h2>
                <p>{t("records.cancelHelp")}</p>
                <Field
                  label={t("records.reason")}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <Button
                  disabled={reason.trim().length < 3}
                  busy={busy}
                  onClick={cancel}
                >
                  {t("records.confirmCancel")}
                </Button>
                {actionError && <p role="alert">{t("records.cancelError")}</p>}
              </Card>
            )}
          <Link to="/jobs/new">{t("records.newWork")}</Link>
        </>
      )}
    </section>
  );
}
