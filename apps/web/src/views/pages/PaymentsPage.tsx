import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Receipt, ReceiptInput } from "@kisan/contracts";
import { paymentClient, type DueItem } from "../../services/payments";
import { Button, Card, Field, Loading } from "../components/ui";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    paise / 100,
  );
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function PaymentsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [dues, setDues] = useState<DueItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [selected, setSelected] = useState<DueItem | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ReceiptInput["method"]>("CASH");
  const [paymentDate, setPaymentDate] = useState(today());
  const [note, setNote] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(crypto.randomUUID());
  const [reversalId, setReversalId] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const reload = useCallback(async () => {
    try {
      const [duePage, receiptPage] = await Promise.all([
        paymentClient.dues({
          q: search,
          status,
          equipmentId,
          page: 1,
          pageSize: 100,
        }),
        paymentClient.receipts({ page: 1, pageSize: 100 }),
      ]);
      setDues(duePage.items);
      setReceipts(receiptPage.items);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, status, equipmentId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    const id = params.get("invoiceId");
    if (id) setSelected(dues.find((item) => item.invoiceId === id) ?? null);
  }, [dues, params]);
  const paise = /^\d+(\.\d{1,2})?$/.test(amount)
    ? Math.round(Number(amount) * 100)
    : 0;
  function choose(item: DueItem) {
    setSelected(item);
    setAmount((item.duePaise / 100).toFixed(2));
    setReview(false);
    setKey(crypto.randomUUID());
  }
  async function post() {
    if (!selected || paise <= 0 || paise > selected.duePaise) return;
    setBusy(true);
    try {
      await paymentClient.post(
        {
          invoiceId: selected.invoiceId,
          amountPaise: paise,
          method,
          paymentDate,
          ...(note && { note }),
        },
        key,
      );
      setSelected(null);
      setReview(false);
      setAmount("");
      setKey(crypto.randomUUID());
      await reload();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function reverse() {
    setBusy(true);
    try {
      await paymentClient.reverse(reversalId, reversalReason);
      setReversalId("");
      setReversalReason("");
      await reload();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="records-page">
      <h1>{t("pages.payments.title")}</h1>
      <p>{t("pages.payments.description")}</p>
      {error && <p role="alert">{t("payments.error")}</p>}
      {loading && <Loading />}
      <Card className="records-filters">
        <Field
          label={t("payments.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="field">
          <label htmlFor="due-status">{t("payments.status")}</label>
          <select
            id="due-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">{t("payments.all")}</option>
            {["UNPAID", "PARTIAL", "PAID"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <Field
          label={t("payments.equipmentId")}
          value={equipmentId}
          onChange={(event) => setEquipmentId(event.target.value)}
        />
      </Card>
      <h2>{t("payments.dues")}</h2>
      <div className="records-list">
        {dues.map((item) => (
          <Card key={item.invoiceId} className="record-card">
            <div>
              <strong>{item.invoiceNumber}</strong>
              <p>
                {item.farmerName} · {item.village}
              </p>
              <p>{item.status}</p>
            </div>
            <div>
              <p>
                {t("payments.due")}: {money(item.duePaise)}
              </p>
              {item.estimatedEquipmentDuePaise !== undefined && (
                <p>
                  {t("payments.estimated")}:{" "}
                  {money(item.estimatedEquipmentDuePaise)}
                </p>
              )}
              <Button
                disabled={item.duePaise === 0}
                onClick={() => choose(item)}
              >
                {t("payments.collect")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {selected && (
        <Card>
          <h2>
            {t("payments.collect")} · {selected.invoiceNumber}
          </h2>
          <p>
            {t("payments.total")}: {money(selected.totalPaise)} ·{" "}
            {t("payments.paid")}: {money(selected.paidPaise)} ·{" "}
            {t("payments.due")}: {money(selected.duePaise)}
          </p>
          <Field
            label={t("payments.amount")}
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setReview(false);
            }}
          />
          <div className="field">
            <label htmlFor="payment-method">{t("payments.method")}</label>
            <select
              id="payment-method"
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as ReceiptInput["method"])
              }
            >
              {["CASH", "UPI", "BANK", "OTHER"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <Field
            label={t("payments.date")}
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
          <Field
            label={t("payments.note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {paise > selected.duePaise && (
            <p role="alert">{t("payments.overpay")}</p>
          )}
          {review ? (
            <>
              <p>
                {t("payments.reviewText", {
                  amount: money(paise),
                  invoice: selected.invoiceNumber,
                })}
              </p>
              <Button busy={busy} onClick={post}>
                {t("payments.confirm")}
              </Button>
              <Button onClick={() => setReview(false)}>{t("work.back")}</Button>
            </>
          ) : (
            <Button
              disabled={paise <= 0 || paise > selected.duePaise || !paymentDate}
              onClick={() => setReview(true)}
            >
              {t("payments.review")}
            </Button>
          )}
        </Card>
      )}
      <h2>{t("payments.history")}</h2>
      <div className="records-list">
        {receipts.map((item) => (
          <Card key={item.id} className="record-card">
            <div>
              <strong>{money(item.amountPaise)}</strong>
              <p>
                {item.paymentDate} · {item.method} · {item.status}
              </p>
              <small>{item.id}</small>
              {item.reversalReason && <p>{item.reversalReason}</p>}
            </div>
            {item.status === "POSTED" && (
              <Button onClick={() => setReversalId(item.id)}>
                {t("payments.reverse")}
              </Button>
            )}
          </Card>
        ))}
      </div>
      {reversalId && (
        <Card>
          <Field
            label={t("payments.reason")}
            value={reversalReason}
            onChange={(event) => setReversalReason(event.target.value)}
          />
          <Button
            disabled={reversalReason.trim().length < 3}
            busy={busy}
            onClick={reverse}
          >
            {t("payments.confirmReverse")}
          </Button>
        </Card>
      )}
    </section>
  );
}
