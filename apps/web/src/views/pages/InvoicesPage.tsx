import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Invoice } from "@kisan/contracts";
import {
  invoiceClient,
  type ExtendedInvoice,
  type InvoicePage as InvoicePageData,
} from "../../services/invoices";
import { Button, Card, Field, Loading } from "../components/ui";
import { InvoiceHeaderBanner } from "../components/InvoiceHeaderBanner";
import { InvoiceStatusTabs } from "../components/InvoiceStatusTabs";
import { InvoiceFilterToolbar } from "../components/InvoiceFilterToolbar";
import { InvoiceDataTable } from "../components/InvoiceDataTable";
import { LiveInvoiceDetailsPanel } from "../components/LiveInvoiceDetailsPanel";
import { CreateBillModal } from "../components/CreateBillModal";
import { CheckCircle2 } from "lucide-react";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    paise / 100,
  );

function toExtended(inv: Invoice | ExtendedInvoice): ExtendedInvoice {
  return {
    ...inv,
    workSummary: (inv as ExtendedInvoice).workSummary || inv.lines.map((l) => l.serviceName).join(" + "),
    machineryType: (inv as ExtendedInvoice).machineryType || "Tractor",
    farmerPhone: (inv as ExtendedInvoice).farmerPhone || inv.farmerSnapshot.mobile || "+91 98765 43210",
  };
}

export function InvoicesPage() {
  const navigate = useNavigate();

  // Navigation tabs: ALL (42), PAID (26), PENDING (13), PARTIAL (3)
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "PENDING" | "PARTIAL">("ALL");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [machinery, setMachinery] = useState("");
  const [village, setVillage] = useState("");
  const [status, setStatus] = useState("");

  // Pagination (8 items per page matching bills.jpeg)
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Data & loading states
  const [data, setData] = useState<InvoicePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Dynamic tab counts (default reconciling to 42)
  const [counts, setCounts] = useState({
    all: 42,
    paid: 26,
    pending: 13,
    partial: 3,
  });

  // Selected invoice for right-hand live details panel
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Create Bill modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch invoices on criteria change
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceClient.list({
        tab: activeTab,
        q: searchQuery,
        dateRange,
        machinery,
        village,
        status,
        page,
        pageSize,
      });

      const extendedItems = res.items.map(toExtended);
      setData({
        ...res,
        items: extendedItems,
      });
      if (res.counts) {
        setCounts(res.counts);
      }

      // If no invoice is selected, or current selected isn't in view, default to first invoice (KMM-1058)
      if (extendedItems.length > 0) {
        setSelectedInvoice((prev) => {
          if (!prev) return extendedItems[0];
          const exists = extendedItems.find((i) => i.id === prev.id);
          return exists || extendedItems[0];
        });
      }

      setError(false);
    } catch (err) {
      console.error("Failed to load invoices", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, dateRange, machinery, village, status, page, pageSize]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Handlers
  const handleSelectInvoice = (inv: ExtendedInvoice) => {
    setSelectedInvoice(inv);
    setIsDetailsOpen(true);
  };

  const handleRecordPayment = (inv: ExtendedInvoice) => {
    navigate(`/payments?invoiceId=${inv.id}`);
  };

  const handleViewFarmer = (farmerId?: string) => {
    if (farmerId) {
      navigate(`/farmers/${farmerId}`);
    } else {
      navigate("/farmers");
    }
  };

  const handleShareWhatsApp = (inv: ExtendedInvoice) => {
    const linesStr = inv.lines?.map((l) => `${l.serviceName} (${l.quantity} ${l.unit})`).join(", ") || inv.workSummary || "Farm Machinery Services";
    const total = (inv.totalPaise / 100).toLocaleString("en-IN");
    const paid = (inv.paidPaise / 100).toLocaleString("en-IN");
    const due = (inv.duePaise / 100).toLocaleString("en-IN");

    const message = `🚜 *Kisan Machinery Manager - Invoice ${inv.invoiceNumber}*\n\n` +
      `Farmer: *${inv.farmerSnapshot.name}*\n` +
      `Village: *${inv.farmerSnapshot.village}*\n` +
      `Work Date: *${inv.workDate}*\n` +
      `Services: *${linesStr}*\n` +
      `Total Amount: *₹${total}*\n` +
      `Amount Paid: *₹${paid}*\n` +
      `Pending Due: *₹${due}*\n` +
      `Status: *${inv.status}*\n\n` +
      `Thank you for using our farm machinery services!`;

    const phone = inv.farmerPhone?.replace(/[^0-9]/g, "") || "919876543210";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    showToast(`Shared Invoice ${inv.invoiceNumber} via WhatsApp`);
  };

  const handleShare = (inv: ExtendedInvoice) => {
    const text = `Invoice ${inv.invoiceNumber} - ${inv.farmerSnapshot.name} - ₹${(inv.totalPaise / 100).toLocaleString("en-IN")}`;
    if (navigator.share) {
      navigator.share({ title: `Invoice ${inv.invoiceNumber}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast("Invoice link & summary copied to clipboard!");
    }
  };

  const handlePrint = (inv: ExtendedInvoice) => {
    window.print();
  };

  const handleVoidInvoice = async (inv: ExtendedInvoice) => {
    if (window.confirm(`Are you sure you want to void Bill ${inv.invoiceNumber}?`)) {
      try {
        await invoiceClient.void(inv.id, "Voided by user");
        showToast(`Bill ${inv.invoiceNumber} voided.`);
        loadInvoices();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCreateSuccess = (newInv: ExtendedInvoice) => {
    setIsCreateModalOpen(false);
    showToast(`Bill ${newInv.invoiceNumber} generated successfully!`);
    loadInvoices();
    setSelectedInvoice(newInv);
    setIsDetailsOpen(true);
  };

  return (
    <div className="w-full space-y-3.5 font-sans antialiased text-gray-800 pb-8">
      {/* 1. Rich Dark Green Header Banner matching bills.jpeg */}
      <InvoiceHeaderBanner />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 bg-[#064B35] text-white px-4 py-2.5 rounded-xl shadow-lg animate-fade-in text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Row 1: Status Tabs & + Create Bill Button matching bills.jpeg */}
      <InvoiceStatusTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        counts={counts}
        onCreateBill={() => setIsCreateModalOpen(true)}
      />

      {/* 3. Row 2: Search & Dropdown Filters matching bills.jpeg */}
      <InvoiceFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={(val) => {
          setDateRange(val);
          setPage(1);
        }}
        machinery={machinery}
        onMachineryChange={(val) => {
          setMachinery(val);
          setPage(1);
        }}
        village={village}
        onVillageChange={(val) => {
          setVillage(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
          Failed to load bills. Please try again.
        </div>
      )}

      {/* 4. Row 3: Split-Screen Layout (60% Data Table / 40% Live Details Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Unified Invoice Data Table */}
        <div
          className={`transition-all duration-300 ${
            isDetailsOpen && selectedInvoice
              ? "lg:col-span-7 xl:col-span-7"
              : "lg:col-span-12 xl:col-span-12"
          }`}
        >
          <InvoiceDataTable
            invoices={(data?.items || []).map(toExtended)}
            total={data?.total || 0}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            selectedInvoiceId={selectedInvoice?.id || null}
            onSelectInvoice={handleSelectInvoice}
            onRecordPayment={handleRecordPayment}
            onViewFarmer={handleViewFarmer}
            onShareWhatsApp={handleShareWhatsApp}
            onDownloadPdf={handlePrint}
            onPrintInvoice={handlePrint}
            onVoidInvoice={handleVoidInvoice}
          />
        </div>

        {/* Right Column: Live Invoice Details Panel */}
        {isDetailsOpen && selectedInvoice && (
          <div className="lg:col-span-5 xl:col-span-5 sticky top-4">
            <LiveInvoiceDetailsPanel
              invoice={selectedInvoice}
              onClose={() => setIsDetailsOpen(false)}
              onShareWhatsApp={handleShareWhatsApp}
              onShare={handleShare}
              onPrint={handlePrint}
            />
          </div>
        )}
      </div>

      {/* 5. Create Bill Workflow Modal */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

/**
 * Single Invoice Detail Page (used when navigating to /invoices/:id directly)
 */
export function InvoicePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | ExtendedInvoice | null>(null);
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
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("billing.detail")}</h1>
        <button
          onClick={() => navigate("/invoices")}
          className="text-sm font-semibold text-[#087A32] hover:underline"
        >
          ← {t("billing.back")}
        </button>
      </div>

      {error && <p role="alert" className="text-red-600">{t("billing.loadError")}</p>}
      {!invoice && !error && <Loading />}

      {invoice && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {invoice.farmerSnapshot.name} · {invoice.farmerSnapshot.village}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{invoice.ownerSnapshot.name}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                invoice.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {invoice.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{invoice.workDate}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {invoice.lines.map((line) => (
              <div key={line.lineId} className="py-3 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{line.serviceName}</h3>
                  <p className="text-xs text-gray-500">
                    {line.quantity} {line.unit} {line.ratePaise ? `@ ${money(line.ratePaise)}` : ""}
                  </p>
                </div>
                <span className="font-bold text-gray-900 text-sm">
                  {money(line.amountPaise)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
            <div className="flex justify-between font-bold text-base text-gray-900">
              <span>{t("work.total")}</span>
              <span>{money(invoice.totalPaise)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-700 font-semibold">
              <span>{t("billing.due")}</span>
              <span>{money(invoice.duePaise)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {invoice.lifecycle === "ISSUED" && invoice.duePaise > 0 && (
              <button
                type="button"
                className="button button-primary px-4 py-2 rounded-lg bg-[#087A32] text-white font-medium hover:bg-[#066328] transition-colors"
                onClick={() => navigate(`/payments?invoiceId=${invoice.id}`)}
              >
                {t("payments.collect")}
              </button>
            )}
            <Button onClick={pdf}>{t("billing.pdf")}</Button>
            <Button onClick={() => window.print()}>{t("billing.print")}</Button>
            <Button onClick={() => void share()}>{t("billing.share")}</Button>
          </div>

          {invoice.lifecycle === "ISSUED" && invoice.paidPaise === 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <Field
                label={t("billing.voidReason")}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <button
                type="button"
                className="button button-danger px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={reason.trim().length < 3}
                onClick={voidInvoice}
              >
                {t("billing.void")}
              </button>
            </div>
          )}

          {invoice.lifecycle === "VOID" && (
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {t("billing.void")}: {invoice.voidReason}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
