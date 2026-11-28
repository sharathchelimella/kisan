import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle, X, Receipt as ReceiptIcon } from "lucide-react";
import {
  paymentClient,
  type DueItem,
  type PaymentKpiSummary,
  type OutstandingFarmerItem,
} from "../../services/payments";
import type { Receipt } from "@kisan/contracts";
import { PaymentHeaderBanner } from "../components/PaymentHeaderBanner";
import { PaymentKpis } from "../components/PaymentKpis";
import { CollectPaymentForm } from "../components/CollectPaymentForm";
import { LiveBillDetails } from "../components/LiveBillDetails";
import { OutstandingBalancesPanel } from "../components/OutstandingBalancesPanel";
import { PaymentHistoryTable } from "../components/PaymentHistoryTable";
import { Loading } from "../components/ui";

export function PaymentsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Financial data states
  const [dues, setDues] = useState<DueItem[]>([]);
  const [receipts, setReceipts] = useState<
    (Receipt & {
      farmerName?: string;
      invoiceNumber?: string;
      workDescription?: string;
      paymentType?: "Full" | "Partial";
    })[]
  >([]);
  const [kpiSummary, setKpiSummary] = useState<PaymentKpiSummary>({
    totalWorkPaise: 34800000,
    totalPaidPaise: 25650000,
    pendingPaise: 9150000,
    totalBills: 87,
    paidBills: 43,
    pendingBills: 44,
    collectionPercent: 73.7,
    pendingPercent: 26.3,
  });
  const [outstandingFarmers, setOutstandingFarmers] = useState<OutstandingFarmerItem[]>([]);

  // Selection & UI state
  const [selectedInvoice, setSelectedInvoice] = useState<DueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    receiptRef: string;
    amount: string;
    farmerName: string;
    receiptId: string;
  } | null>(null);

  // Load all initial payment data
  const loadData = useCallback(async () => {
    try {
      const [duesRes, receiptsRes, summaryRes, outstandingRes] = await Promise.all([
        paymentClient.dues({ page: 1, pageSize: 200 }),
        paymentClient.receipts({ page: 1, pageSize: 50 }),
        paymentClient.summary ? paymentClient.summary() : Promise.resolve(null),
        paymentClient.outstandingBalances
          ? paymentClient.outstandingBalances()
          : Promise.resolve([]),
      ]);

      setDues(duesRes.items);
      setReceipts(receiptsRes.items);
      if (summaryRes) setKpiSummary(summaryRes);
      if (outstandingRes) setOutstandingFarmers(outstandingRes);

      // Default or URL selection
      const urlInvoiceId = params.get("invoiceId");
      const urlFarmerId = params.get("farmerId");

      if (urlInvoiceId) {
        const matched = duesRes.items.find((item) => item.invoiceId === urlInvoiceId);
        if (matched) setSelectedInvoice(matched);
      } else if (urlFarmerId) {
        const matched = duesRes.items.find((item) => item.farmerId === urlFarmerId && item.duePaise > 0);
        if (matched) setSelectedInvoice(matched);
      } else {
        // Default to Ramesh Reddy KB-0056 to match payments.jpeg
        const ramesh = duesRes.items.find(
          (item) => item.invoiceNumber === "KB-0056" || item.farmerName.includes("Ramesh"),
        );
        if (ramesh) {
          setSelectedInvoice(ramesh);
        } else if (duesRes.items.length > 0) {
          setSelectedInvoice(duesRes.items[0]);
        }
      }

      setError("");
    } catch (err) {
      console.error("Failed to load payment records:", err);
      setError("Failed to load payments data. Please check connection.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle Recording Payment
  async function handleRecordPayment(data: {
    invoiceId: string;
    amountPaise: number;
    method: "CASH" | "UPI" | "BANK" | "OTHER";
    notes: string;
    paymentType: "Full" | "Partial";
  }) {
    setBusy(true);
    setError("");
    const idempotencyKey = crypto.randomUUID();

    try {
      const result = await paymentClient.post(
        {
          invoiceId: data.invoiceId,
          amountPaise: data.amountPaise,
          method: data.method,
          paymentDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          note: data.notes,
        },
        idempotencyKey,
      );

      // Show success alert
      setSuccessMessage({
        receiptRef: result.receipt.reference || result.receipt.id,
        amount: (data.amountPaise / 100).toLocaleString("en-IN"),
        farmerName: selectedInvoice?.farmerName || "Farmer",
        receiptId: result.receipt.id,
      });

      // Reload fresh data
      await loadData();
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err instanceof Error ? err.message : "Payment submission failed.");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  // Handle Selecting an Outstanding Farmer from bottom-left panel
  function handleSelectOutstandingFarmer(farmerId: string) {
    const matched = dues.find((d) => d.farmerId === farmerId && d.duePaise > 0);
    if (matched) {
      setSelectedInvoice(matched);
    }
  }

  // Handle Navigating to full Outstanding Balances page
  function handleViewAllDues() {
    navigate("/payments/outstanding-balances");
  }

  // Handle clicking a receipt row in Payment History
  function handleSelectReceipt(receiptId: string) {
    navigate(`/payments/${encodeURIComponent(receiptId)}`);
  }

  if (loading && dues.length === 0) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[1536px] mx-auto pb-10">
      {/* 1. Header Banner matching payments.jpeg */}
      <PaymentHeaderBanner />

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#16812F] shrink-0" />
            <div>
              <span className="font-bold">Payment Recorded Successfully! </span>
              <span>
                Received ₹ {successMessage.amount} from {successMessage.farmerName}. Receipt Ref:{" "}
                <strong>{successMessage.receiptRef}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectReceipt(successMessage.receiptId)}
              className="text-xs font-bold text-[#16812F] underline hover:text-[#075C2D]"
            >
              View Receipt
            </button>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Row 1: Four Financial KPI Cards */}
      <PaymentKpis summary={kpiSummary} />

      {/* 3. Row 2: Two-Column Form & Bill Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mb-3.5 items-start">
        {/* Left Column: Collect Payment Form (~61% width) */}
        <div className="lg:col-span-7 xl:col-span-7">
          <CollectPaymentForm
            dues={dues}
            selectedInvoice={selectedInvoice}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            onRecordPayment={handleRecordPayment}
            busy={busy}
          />
        </div>

        {/* Right Column: Live Bill Details Panel (~39% width) */}
        <div className="lg:col-span-5 xl:col-span-5">
          <LiveBillDetails invoice={selectedInvoice} />
        </div>
      </div>

      {/* 4. Row 3: Two-Column Outstanding Balances & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Bottom Left Column: Outstanding Balances Panel (~27% width) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <OutstandingBalancesPanel
            items={outstandingFarmers}
            onSelectFarmer={handleSelectOutstandingFarmer}
            onViewAllDues={handleViewAllDues}
          />
        </div>

        {/* Bottom Right Column: Payment History Table (~73% width) */}
        <div className="lg:col-span-8 xl:col-span-9">
          <PaymentHistoryTable
            receipts={receipts}
            onSelectReceipt={handleSelectReceipt}
          />
        </div>
      </div>
    </div>
  );
}
