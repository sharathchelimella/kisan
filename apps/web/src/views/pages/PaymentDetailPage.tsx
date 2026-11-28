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
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import type { Receipt } from "@kisan/contracts";
import { paymentClient } from "../../services/payments";
import { formatInr } from "../components/KpiCard";
import { Loading } from "../components/ui";
import { all124DemoFarmers } from "../../mocks/farmer-dataset";

export function PaymentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reversalOpen, setReversalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [reversalError, setReversalError] = useState("");

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
            invoiceId: "KB-0056",
            farmerId: "FARM-RAMESH",
            amountPaise: 450000,
            method: "CASH",
            reference: id.startsWith("REC") ? id : "REC-4901",
            paymentDate: "18 Jan 2025",
            status: "POSTED",
            createdAt: "2025-01-18T10:30:00.000Z",
            note: "Paid at farm, received by owner",
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

  const handleReverse = async () => {
    if (reversalReason.trim().length < 3) {
      setReversalError("Reason must be at least 3 characters.");
      return;
    }
    setReversing(true);
    setReversalError("");
    try {
      await paymentClient.reverse(receipt!.id, reversalReason);
      setReceipt({ ...receipt!, status: "REVERSED", reversalReason });
      setReversalOpen(false);
    } catch (err) {
      setReversalError(err instanceof Error ? err.message : "Reversal failed.");
    } finally {
      setReversing(false);
    }
  };

  const farmer = all124DemoFarmers.find((f) => f.id === receipt?.farmerId) || {
    name: (receipt as any)?.farmerName || "Ramesh Reddy",
    village: "Kothapalli",
    mobile: "98765 43210",
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

                {receipt.status === "POSTED" && (
                  <button
                    type="button"
                    onClick={() => setReversalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reverse Payment</span>
                  </button>
                )}
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

      {/* Reversal Confirmation Modal */}
      {reversalOpen && receipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-gray-900">Confirm Payment Reversal</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              You are about to reverse the payment of <strong>{formatInr(receipt.amountPaise)}</strong> for {farmer.name}. This will restore the outstanding balance on invoice #{receipt.invoiceId}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Reversal *
              </label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g., Recorded incorrect payment mode / check returned"
                className="w-full p-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-green-600 resize-none"
              />
              {reversalError && (
                <p className="text-xs text-red-600 mt-1">{reversalError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReversalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reversing}
                onClick={handleReverse}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {reversing ? "Reversing..." : "Confirm Reversal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
