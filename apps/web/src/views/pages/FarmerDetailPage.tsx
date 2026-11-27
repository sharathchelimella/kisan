import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Tractor,
  WalletCards,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Farmer } from "@kisan/contracts";
import { farmersClient } from "../../services/farmers";
import { formatFarmerCurrency } from "../components/FarmerKpiCards";
import { FarmerModal } from "../components/FarmerModal";
import { Loading } from "../components/ui";

type DetailTab = "overview" | "works" | "invoices" | "payments";

export function FarmerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    farmersClient
      .get(id)
      .then((data) => {
        if (active) {
          setFarmer(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="space-y-4">
        <Link
          to="/farmers"
          className="inline-flex items-center gap-1.5 text-xs text-[#15803D] font-semibold hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Back to Farmers</span>
        </Link>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Farmer record unavailable or not found.
        </div>
      </div>
    );
  }

  const initial = farmer.name ? farmer.name[0].toUpperCase() : "F";
  const worksCount = farmer.totalWorks ?? 8;
  const totalAmount = farmer.totalAmountPaise ?? 8600000;
  const paidAmount = farmer.paidAmountPaise ?? 6000000;
  const pendingAmount = farmer.pendingAmountPaise ?? 2600000;

  // Mock related work records for this farmer
  const sampleJobs = [
    {
      id: "JOB-101",
      date: "2025-01-22",
      service: "Tractor / Ploughing",
      machinery: "Mahindra 575 DI (45 HP)",
      quantity: "3.0 Acres",
      amountPaise: 3000000,
      status: "COMPLETED",
    },
    {
      id: "JOB-102",
      date: "2025-01-18",
      service: "Rotavator Till & Level",
      machinery: "Shaktiman 7ft Rotavator",
      quantity: "2.5 Acres",
      amountPaise: 2600000,
      status: "COMPLETED",
    },
    {
      id: "JOB-103",
      date: "2025-01-12",
      service: "Trailer / Mud Transport",
      machinery: "Hydraulic Tipping Trailer",
      quantity: "5 Trips",
      amountPaise: 3000000,
      status: "COMPLETED",
    },
  ];

  // Mock related invoices
  const sampleInvoices = [
    {
      invoiceNumber: "KMM-00101",
      date: "2025-01-22",
      totalPaise: 3000000,
      paidPaise: 1000000,
      duePaise: 2000000,
      status: "PARTIAL",
    },
    {
      invoiceNumber: "KMM-00088",
      date: "2025-01-18",
      totalPaise: 2600000,
      paidPaise: 2000000,
      duePaise: 600000,
      status: "PARTIAL",
    },
    {
      invoiceNumber: "KMM-00064",
      date: "2025-01-12",
      totalPaise: 3000000,
      paidPaise: 3000000,
      duePaise: 0,
      status: "PAID",
    },
  ];

  // Mock related payments
  const samplePayments = [
    {
      receiptNumber: "REC-2025-042",
      date: "2025-01-20",
      amountPaise: 2000000,
      method: "UPI (PhonePe)",
      invoiceNumber: "KMM-00088",
      notes: "Advance payment for rotavator",
    },
    {
      receiptNumber: "REC-2025-031",
      date: "2025-01-14",
      amountPaise: 3000000,
      method: "CASH",
      invoiceNumber: "KMM-00064",
      notes: "Settled in full after mud haul",
    },
    {
      receiptNumber: "REC-2025-015",
      date: "2025-01-08",
      amountPaise: 1000000,
      method: "BANK_TRANSFER",
      invoiceNumber: "KMM-00101",
      notes: "Part payment via NEFT",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Back button */}
      <div>
        <Link
          to="/farmers"
          className="inline-flex items-center gap-1.5 text-xs text-[#15803D] font-bold hover:underline"
        >
          <ArrowLeft size={15} />
          <span>Back to Farmers Directory</span>
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#D5EED9] text-[#064B35] font-bold text-2xl md:text-3xl flex items-center justify-center flex-shrink-0 shadow-sm">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-[#17251C]">
                {farmer.name}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-[#647067] font-semibold">
                {farmer.id}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E4F6E4] text-[#15803D]">
                {farmer.archivedAt ? "Archived" : "Active Farmer"}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-[#647067] flex-wrap">
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-[#15803D]" />
                <a
                  href={`tel:${farmer.mobile?.replace(/\s+/g, "")}`}
                  className="hover:underline font-medium text-[#17251C]"
                >
                  {farmer.mobile || "Not provided"}
                </a>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-[#15803D]" />
                <span>{farmer.village}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-[#647067]" />
                <span>
                  Member since{" "}
                  {farmer.createdAt ? farmer.createdAt.slice(0, 10) : "Jan 2025"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8E5] text-[#17251C] hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Pencil size={14} className="text-[#647067]" />
            <span>Edit Profile</span>
          </button>
          <Link
            to={`/jobs/new?farmerId=${encodeURIComponent(farmer.id)}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#087A32] hover:bg-[#066127] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors no-underline cursor-pointer"
          >
            <Tractor size={15} />
            <span>Add Work</span>
          </Link>
          <Link
            to={`/payments?farmerId=${encodeURIComponent(farmer.id)}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#064B35] rounded-xl text-xs font-semibold border border-emerald-200 transition-colors no-underline cursor-pointer"
          >
            <WalletCards size={15} />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* 4 Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#647067]">
            <Tractor size={15} className="text-blue-600" />
            <span>Completed Works</span>
          </div>
          <p className="text-2xl font-bold text-[#17251C] mt-2">{worksCount}</p>
          <span className="text-[11px] text-[#647067]">Total machinery jobs</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#647067]">
            <FileText size={15} className="text-emerald-600" />
            <span>Total Billed Amount</span>
          </div>
          <p className="text-2xl font-bold text-[#17251C] mt-2 font-mono">
            {formatFarmerCurrency(totalAmount)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Across {sampleInvoices.length} invoices
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#647067]">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Total Paid Amount</span>
          </div>
          <p className="text-2xl font-bold text-[#15803D] mt-2 font-mono">
            {formatFarmerCurrency(paidAmount)}
          </p>
          <span className="text-[11px] text-[#647067]">
            {Math.round((paidAmount / (totalAmount || 1)) * 100)}% collected
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#647067]">
            <Clock size={15} className="text-red-500" />
            <span>Outstanding Balance</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2 font-mono">
            {formatFarmerCurrency(pendingAmount)}
          </p>
          <span className="text-[11px] text-red-500 font-semibold">
            {pendingAmount > 0 ? "Pending collection" : "Fully settled"}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E2E8E5] shadow-sm overflow-x-auto">
        {(
          [
            { id: "overview", label: "Overview", count: null },
            { id: "works", label: "Work History", count: worksCount },
            { id: "invoices", label: "Bills & Invoices", count: sampleInvoices.length },
            { id: "payments", label: "Payment History", count: samplePayments.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-[#064E3B] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#14251C] hover:bg-emerald-50/40"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-[#647067]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#17251C] border-b border-[#F1F5F3] pb-2">
              Farmer Information &amp; Preferences
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-[#647067]">Full Name:</span>
                <span className="font-bold text-[#17251C]">{farmer.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-[#647067]">Village:</span>
                <span className="font-semibold text-[#17251C]">{farmer.village}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-[#647067]">Mobile Phone:</span>
                <span className="font-mono text-[#17251C]">{farmer.mobile || "None"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-[#647067]">Status:</span>
                <span className="font-bold text-emerald-700">ACTIVE</span>
              </div>
              <div>
                <span className="text-[#647067] block mb-1">Notes:</span>
                <p className="p-2.5 rounded-xl bg-gray-50 text-[#17251C] text-[11px] leading-relaxed">
                  {farmer.notes || "No special agricultural notes recorded."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#17251C] border-b border-[#F1F5F3] pb-2">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F7F9F8] border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <Tractor size={15} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#17251C]">
                    Ploughing completed (3 Acres)
                  </p>
                  <span className="text-[#647067] text-[11px]">22 Jan 2025</span>
                </div>
                <span className="ml-auto text-xs font-bold text-[#15803D]">
                  ₹30,000
                </span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F7F9F8] border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <WalletCards size={15} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#17251C]">
                    Payment received via PhonePe
                  </p>
                  <span className="text-[#647067] text-[11px]">20 Jan 2025</span>
                </div>
                <span className="ml-auto text-xs font-bold text-[#15803D]">
                  ₹20,000
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work History */}
      {activeTab === "works" && (
        <div className="bg-white rounded-2xl border border-[#E2E8E5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E5F3E7] text-[#17251C] font-semibold border-b border-[#E2E8E5]">
                  <th className="py-3 px-4">Work ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Assigned Machinery</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9]">
                {sampleJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[#F5FAF5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#17251C]">
                      {j.id}
                    </td>
                    <td className="py-3 px-4 text-[#647067]">{j.date}</td>
                    <td className="py-3 px-4 font-semibold text-[#17251C]">
                      {j.service}
                    </td>
                    <td className="py-3 px-4 text-[#647067]">{j.machinery}</td>
                    <td className="py-3 px-4 text-center font-medium">
                      {j.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#17251C] font-mono">
                      {formatFarmerCurrency(j.amountPaise)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F6E4] text-[#15803D]">
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Bills & Invoices */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl border border-[#E2E8E5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E5F3E7] text-[#17251C] font-semibold border-b border-[#E2E8E5]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9]">
                {sampleInvoices.map((inv) => (
                  <tr
                    key={inv.invoiceNumber}
                    className="hover:bg-[#F5FAF5] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#17251C]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-[#647067]">{inv.date}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#17251C] font-mono">
                      {formatFarmerCurrency(inv.totalPaise)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#15803D] font-bold font-mono">
                      {formatFarmerCurrency(inv.paidPaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono">
                      {inv.duePaise > 0 ? (
                        <span className="text-[#B91C1C]">
                          {formatFarmerCurrency(inv.duePaise)}
                        </span>
                      ) : (
                        <span className="text-[#15803D]">₹ 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-[#E4F6E4] text-[#15803D]"
                            : "bg-[#FDE8E7] text-[#B91C1C]"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/invoices?farmerId=${farmer.id}`}
                        className="text-xs text-[#15803D] hover:underline font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Payment History */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl border border-[#E2E8E5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E5F3E7] text-[#17251C] font-semibold border-b border-[#E2E8E5]">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">For Invoice</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE9]">
                {samplePayments.map((p) => (
                  <tr
                    key={p.receiptNumber}
                    className="hover:bg-[#F5FAF5] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#17251C]">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-[#647067]">{p.date}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#15803D] font-mono">
                      {formatFarmerCurrency(p.amountPaise)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17251C]">
                      {p.method}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#647067]">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-[#647067]">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {isEditModalOpen && (
        <FarmerModal
          farmer={farmer}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => setFarmer(updated)}
        />
      )}
    </div>
  );
}
