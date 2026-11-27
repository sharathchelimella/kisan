import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Invoice } from "@kisan/contracts";
import { invoiceClient, type InvoicePage } from "../../services/invoices";
import { Button, Card, Field, Loading } from "../components/ui";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    paise / 100,
  );
export function InvoicesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InvoicePage | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    invoiceClient
      .list({ q, status, page, pageSize: 20 })
      .then((value) => {
        if (active) {
          setData(value);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [q, status, page]);
  return (
    <section className="records-page">
      <h1>{t("pages.invoices.title")}</h1>
      <p>{t("pages.invoices.description")}</p>
      <Card className="records-filters">
        <Field
          label={t("billing.search")}
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <div className="field">
          <label htmlFor="bill-status">{t("billing.status")}</label>
          <select
            id="bill-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("billing.all")}</option>
            {["UNPAID", "PARTIAL", "PAID", "VOID"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      </Card>
      {error && <p role="alert">{t("billing.loadError")}</p>}
      {!data && !error && <Loading />}
      {data && (
        <>
          <p>{t("billing.count", { count: data.total })}</p>
          <div className="records-list">
            {data.items.map((invoice) => (
              <Card key={invoice.id} className="record-card">
                <div>
                  <h2>{invoice.invoiceNumber}</h2>
                  <p>
                    {invoice.farmerSnapshot.name} · {invoice.workDate}
                  </p>
                  <p>{invoice.status}</p>
                </div>
                <div>
                  <strong>{money(invoice.totalPaise)}</strong>
                  <p>
                    {t("billing.due")}: {money(invoice.duePaise)}
                  </p>
                  <Link to={`/invoices/${invoice.id}`}>
                    {t("billing.view")}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="record-pagination">
            <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t("work.back")}
            </Button>
            {page}
            <Button
              disabled={page * 20 >= data.total}
              onClick={() => setPage(page + 1)}
            >
              {t("work.next")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
export function InvoicePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState(false);
  const [reason, setReason] = useState("");
  useEffect(() => {
    invoiceClient
      .get(id)
      .then(setInvoice)
      .catch(() => setError(true));
  }, [id]);
  async function pdf() {
    try {
      const blob = await invoiceClient.pdf(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      window.print();
    }
  }
  async function share() {
    const text = `${invoice?.invoiceNumber} · ${money(invoice?.totalPaise ?? 0)}`;
    if (navigator.share)
      await navigator.share({ title: invoice?.invoiceNumber, text });
    else await navigator.clipboard.writeText(text);
  }
  async function voidInvoice() {
    try {
      setInvoice(await invoiceClient.void(id, reason));
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <section className="records-page">
      <h1>{t("billing.detail")}</h1>
      <Link to="/invoices">{t("billing.back")}</Link>
      {error && <p role="alert">{t("billing.loadError")}</p>}
      {!invoice && !error && <Loading />}
      {invoice && (
        <>
          <Card>
            <h2>{invoice.invoiceNumber}</h2>
            <p>
              {invoice.farmerSnapshot.name} · {invoice.farmerSnapshot.village}
            </p>
            <p>{invoice.ownerSnapshot.name}</p>
            <p>
              {invoice.workDate} · {invoice.status}
            </p>
          </Card>
          <div className="records-list">
            {invoice.lines.map((line) => (
              <Card key={line.lineId}>
                <h3>{line.serviceName}</h3>
                <p>
                  {line.quantity} {line.unit} · {money(line.amountPaise)}
                </p>
              </Card>
            ))}
          </div>
          <Card>
            <strong>
              {t("work.total")}: {money(invoice.totalPaise)}
            </strong>
            <p>
              {t("billing.due")}: {money(invoice.duePaise)}
            </p>
          </Card>
          <div className="record-pagination">
            {invoice.lifecycle === "ISSUED" && invoice.duePaise > 0 && (
              <Link to={`/payments?invoiceId=${invoice.id}`}>
                {t("payments.collect")}
              </Link>
            )}
            <Button onClick={pdf}>{t("billing.pdf")}</Button>
            <Button onClick={() => window.print()}>{t("billing.print")}</Button>
            <Button onClick={() => void share()}>{t("billing.share")}</Button>
          </div>
          {invoice.lifecycle === "ISSUED" && invoice.paidPaise === 0 && (
            <Card>
              <Field
                label={t("billing.voidReason")}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Button disabled={reason.trim().length < 3} onClick={voidInvoice}>
                {t("billing.void")}
              </Button>
            </Card>
          )}
          {invoice.lifecycle === "VOID" && (
            <p>
              {t("billing.void")}: {invoice.voidReason}
            </p>
          )}
        </>
      )}
    </section>
  );
}
