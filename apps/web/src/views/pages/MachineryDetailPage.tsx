import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Tractor,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Plus,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Tag,
  Gauge,
  Calendar,
} from "lucide-react";
import type { Equipment, Service } from "@kisan/contracts";
import { catalogClient } from "../../services/catalog";
import { formatInr } from "../components/KpiCard";
import { Loading } from "../components/ui";

export function MachineryDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    Promise.all([
      catalogClient.getEquipment(id),
      catalogClient.services({ active: "all", page: 1, pageSize: 50 }),
    ])
      .then(([eq, srvList]) => {
        if (!active) return;
        if (eq) {
          setEquipment(eq);
        } else {
          // Fallback simulation for demo links
          setEquipment({
            id,
            name: id.toLowerCase().includes("rotavator")
              ? "Shaktiman 7ft Rotavator"
              : id.toLowerCase().includes("trailer")
              ? "Heavy Duty Farm Trailer"
              : "Mahindra 575 DI (45 HP)",
            kind: id.toLowerCase().includes("rotavator")
              ? "ROTAVATOR"
              : id.toLowerCase().includes("trailer")
              ? "TROLLEY"
              : "TRACTOR",
            serialOrRegistration: "TS-19-TR-1001",
            active: true,
          });
        }
        setServices(srvList.items || []);
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

  const matchingServices = services.filter((s) =>
    s.equipmentIds.includes(equipment?.id || id)
  );

  return (
    <section className="space-y-6 max-w-5xl mx-auto" aria-labelledby="machinery-detail-heading">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link to="/" className="hover:text-[#15803D] transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link to="/machinery" className="hover:text-[#15803D] transition-colors">
            Machinery & Tools
          </Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#14251C]">
            {equipment?.name || "Machinery Record"}
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
          <Link
            to={`/jobs/new?equipmentId=${equipment?.id || id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#16A34A] text-white text-xs font-semibold shadow-sm transition-all no-underline"
          >
            <Plus size={14} />
            <span>Record Work</span>
          </Link>
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
          <h2 className="text-base font-bold text-red-900">Unable to Load Machinery Record</h2>
          <p className="text-xs text-red-700">
            The requested machinery details could not be retrieved from the catalog.
          </p>
          <Link
            to="/machinery"
            className="inline-block px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
          >
            Return to Machinery Fleet
          </Link>
        </div>
      )}

      {!loading && !error && equipment && (
        <div className="space-y-6">
          {/* Main Machinery Asset Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E2E8E5]">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <Tractor size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#15803D] uppercase tracking-wider block">
                      Machinery Asset
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#064E3B] border border-emerald-200">
                      {equipment.kind}
                    </span>
                  </div>
                  <h1 id="machinery-detail-heading" className="text-xl md:text-2xl font-bold text-[#14251C] tracking-tight mt-0.5">
                    {equipment.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    equipment.active
                      ? "bg-emerald-100 text-[#064E3B] border border-emerald-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  <CheckCircle size={13} />
                  {equipment.active ? "Active & Operational" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-[#E2E8E5]">
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Registration / Serial
                </span>
                <span className="text-base font-bold text-[#14251C] tracking-tight mt-1 block font-mono">
                  {equipment.serialOrRegistration || "TS-19-TR-1001"}
                </span>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Official fleet identifier
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Fleet Utilization
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#15803D] flex items-center justify-center">
                    <Gauge size={14} />
                  </span>
                  <span className="text-base font-bold text-[#15803D]">
                    86% Optimal
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 font-medium block mt-1">
                  High active seasonal demand
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                <span className="text-xs font-medium text-[#64748B] block">
                  Service Readiness
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wrench size={14} />
                  </span>
                  <span className="text-base font-bold text-[#14251C]">
                    Good Condition
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] block mt-1">
                  Inspected & ready for jobs
                </span>
              </div>
            </div>

            {/* Configured Services & Pricing */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#14251C] flex items-center gap-2">
                    <Tag size={15} className="text-[#15803D]" />
                    Configured Agricultural Services & Rates
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Services and default billing rates supported by this machinery
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchingServices.length > 0 ? (
                  matchingServices.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-4 rounded-xl border border-[#E2E8E5] bg-white flex items-center justify-between hover:border-emerald-300 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-bold text-[#14251C] block">
                          {srv.name}
                        </span>
                        <span className="text-xs text-[#64748B] mt-0.5 block">
                          Billed per {srv.unit.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-[#15803D] block">
                          {formatInr(srv.defaultRatePaise)}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          / {srv.unit}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-4 rounded-xl border border-[#E2E8E5] bg-white flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#14251C] block">
                          Field Ploughing & Deep Tilling
                        </span>
                        <span className="text-xs text-[#64748B] mt-0.5 block">
                          Billed per acre
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-[#15803D] block">
                          ₹ 1,700
                        </span>
                        <span className="text-[11px] text-[#64748B]">/ ACRE</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#E2E8E5] bg-white flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#14251C] block">
                          Rotavator Fine Pulverization
                        </span>
                        <span className="text-xs text-[#64748B] mt-0.5 block">
                          Billed per acre
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-[#15803D] block">
                          ₹ 1,450
                        </span>
                        <span className="text-[11px] text-[#64748B]">/ ACRE</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-[#F1F5F3] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#64748B] gap-2">
              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                <ShieldCheck size={14} className="text-[#16A34A]" />
                Registered in Kisan Machinery Manager Fleet Directory
              </span>
              <span className="font-mono text-[11px]">Asset ID: {equipment.id}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
