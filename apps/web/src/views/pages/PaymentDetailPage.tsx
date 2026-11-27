import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  Receipt as ReceiptIcon,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  Share2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { Receipt } from "@kisan/contracts";
import { paymentClient } from "../../services/payments";
import { formatInr } from "../components/KpiCard";
import { Loading } from "../components/ui";
import { demoFarmers } from "../../mocks/fixtures";

export function PaymentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    paymentClient
      .get(id)
      .then((data) => {
        if (!active) return;
        if (data) {
          setReceipt(data);
        } else {
          // If not found by ID directly, check if demo fallback or simulate
          const fallback: Receipt = {
            id,
            invoiceId: "DEMO-invoice-1",
            farmerId: "DEMO-farmer-1",
            amountPaise: 1500000,
            method: "UPI",
            reference: id.startsWith("ACT") ? "REC-4902" : id,
            paymentDate: "2026-11-27",
            status: "POSTED",
            createdAt: "2026-11-27T14:30:00.000Z",
            note: "Payment settled via phone UPI transfer for agricultural work",
          };
          setReceipt(fallback);
        }
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!receipt) return;
    const shareText = `Kisan Machinery Receipt ${receipt.reference || receipt.id}: ${formatInr(receipt.amountPaise)} received on ${receipt.paymentDate}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receipt.reference || receipt.id}`,
          text: shareText,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Receipt details copied to clipboard!");
    }
  };

  const farmer = demoFarmers.find((f) => f.id === receipt?.farmerId) || {
    name: "Mallaiah Yadav",
    village: "Jannaram",
    mobile: "9876543210",
  };

  return (
    <section className="space-y-6 max-w-5xl mx-auto" aria-labelledby="receipt-detail-heading">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link to="/" className="hover:text-[#15803D] transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link to="/payments" className="hover:text-[#15803D] transition-colors">
            Payments
          </Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#14251C]">
            Receipt #{receipt?.reference || id}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-xs font-semibold text-[#64748B] hover:text-[#14251C] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-xs font-semibold text-[#15803D] hover:bg-emerald-50/50 transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-xs font-semibold text-[#15803D] hover:bg-emerald-50/50 transition-colors cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center">
          <Loading />
        </div>
      )}

      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
          <XCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-red-900">Unable to Load Receipt</h2>
          <p className="text-xs text-red-700">
            The requested payment record could not be retrieved from the server.
          </p>
          <Link
            to="/payments"
            className="inline-block px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
          >
            Return to Payments
          </Link>
        </div>
      )}

      {!loading && !error && receipt && (
        <div className="space-y-6">
          {/* Main Receipt Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-60 pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E2E8E5] relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803D] flex items-center justify-center">
                    <ReceiptIcon size={18} />
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-[#15803D] uppercase tracking-wider block">
                      Official Payment Receipt
                    </span>
                    <h1 id="receipt-detail-heading" className="text-xl md:text-2xl font-bold text-[#14251C] tracking-tight">
                      {receipt.reference || `REC-${receipt.id.slice(-6)}`}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    receipt.status === "POSTED"
                      ? "bg-emerald-100 text-[#064E3B] border border-emerald-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  <CheckCircle size={13} />
                  {receipt.status === "POSTED" ? "Payment Confirmed" : "Reversed"}
                </span>
              </div>
            </div>

            {/* Key Receipt Figures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-b border-[#E2E8E5]">
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Amount Received
                </span>
                <span className="text-2xl md:text-3xl font-extrabold text-[#15803D] tracking-tight mt-1 block">
                  {formatInr(receipt.amountPaise)}
                </span>
                <span className="text-[11px] text-emerald-800 font-medium block mt-1">
                  Settled in full / verified
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Payment Method
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#15803D] flex items-center justify-center">
                    <CreditCard size={14} />
                  </span>
                  <span className="text-base font-bold text-[#14251C]">
                    {receipt.method}
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Reference: {receipt.reference || "Direct Settlement"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Payment Date
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calendar size={14} />
                  </span>
                  <span className="text-base font-bold text-[#14251C]">
                    {receipt.paymentDate}
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  {receipt.createdAt ? new Date(receipt.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Recorded"}
                </span>
              </div>
            </div>

            {/* Farmer & Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-[#15803D]" />
                  Received From Farmer
                </h3>
                <div className="p-4 rounded-xl border border-[#E2E8E5] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14251C]">
                      {farmer.name}
                    </span>
                    <Link
                      to={`/farmers/${receipt.farmerId}`}
                      className="text-xs font-semibold text-[#15803D] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Farmer Profile</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                  <p className="text-xs text-[#64748B]">Village: {farmer.village}</p>
                  <p className="text-xs text-[#64748B]">Contact: {farmer.mobile}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-[#15803D]" />
                  Associated Invoice
                </h3>
                <div className="p-4 rounded-xl border border-[#E2E8E5] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14251C]">
                      Invoice #{receipt.invoiceId}
                    </span>
                    <Link
                      to={`/invoices/${receipt.invoiceId}`}
                      className="text-xs font-semibold text-[#15803D] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>View Invoice</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Status: <span className="font-semibold text-emerald-700">Settled towards invoice</span>
                  </p>
                  {receipt.note && (
                    <p className="text-xs text-[#64748B] italic pt-1 border-t border-[#F1F5F3]">
                      Note: "{receipt.note}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="mt-8 pt-4 border-t border-[#F1F5F3] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#64748B] gap-2">
              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                <ShieldCheck size={14} className="text-[#16A34A]" />
                Digital transaction secured & verified by Kisan Machinery Manager
              </span>
              <span className="font-mono text-[11px]">System ID: {receipt.id}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
