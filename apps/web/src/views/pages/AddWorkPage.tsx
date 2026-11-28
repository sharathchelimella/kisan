import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Search,
  UserPlus,
  Users,
  Phone,
  MapPin,
  Tractor,
  Calendar,
  Layers,
  IndianRupee,
  Calculator,
  FileText,
  ChevronDown,
  Info,
  FileEdit,
  Pencil,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ReceiptText,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
import {
  jobInputSchema,
  type Job,
  type JobInput,
  type PricingUnit,
} from "@kisan/contracts";
import { parseRupees } from "@kisan/domain";
import { useJobOptions } from "../../controllers/useJobOptions";
import { jobClient } from "../../services/jobs";
import { farmersClient } from "../../services/farmers";
import { AddWorkStepper } from "../components/AddWorkStepper";
import { AddWorkSummary } from "../components/AddWorkSummary";
import { Loading } from "../components/ui";

// Machinery illustration imports
import tractorSvg from "../../assets/machinery/tractor.svg";
import rotavatorSvg from "../../assets/machinery/rotavator.svg";
import ploughSvg from "../../assets/machinery/plough.svg";
import cultivatorSvg from "../../assets/machinery/cultivator.svg";
import trailerSvg from "../../assets/machinery/trailer.svg";
import harrowSvg from "../../assets/machinery/harrow.svg";

interface MachineryOption {
  id: string;
  serviceId?: string;
  name: string;
  workType: string;
  unit: PricingUnit;
  defaultRate: number; // ₹
  illustration: string;
  secondaryIllustration?: string;
  description: string;
}

const MACHINERY_OPTIONS: MachineryOption[] = [
  {
    id: "tractor-rotavator",
    name: "Tractor + Rotavator",
    workType: "Rotavator (Cultivation)",
    unit: "ACRE",
    defaultRate: 1500,
    illustration: tractorSvg,
    secondaryIllustration: rotavatorSvg,
    description: "Ideal for seedbed preparation and secondary soil pulverization.",
  },
  {
    id: "tractor-plough",
    name: "Tractor + Plough",
    workType: "Ploughing",
    unit: "ACRE",
    defaultRate: 1200,
    illustration: tractorSvg,
    secondaryIllustration: ploughSvg,
    description: "Deep soil turning and breaking hardpan for initial season prep.",
  },
  {
    id: "tractor-cultivator",
    name: "Tractor + Cultivator",
    workType: "Land Preparation",
    unit: "ACRE",
    defaultRate: 1000,
    illustration: cultivatorSvg,
    description: "Aerates soil, removes weeds and mixes fertilizers effectively.",
  },
  {
    id: "tractor-single",
    name: "Tractor (General Work)",
    workType: "General Work / Haulage",
    unit: "HOUR",
    defaultRate: 800,
    illustration: tractorSvg,
    description: "Hourly haulage, engine-driven water pumping or general field chores.",
  },
  {
    id: "tractor-trailer",
    name: "Tractor + Trailer",
    workType: "Mud / Crop Transportation",
    unit: "TRIP",
    defaultRate: 2000,
    illustration: trailerSvg,
    description: "Heavy tipping trolley for agricultural produce, sand and manure transport.",
  },
  {
    id: "tractor-disc-harrow",
    name: "Tractor + Disc Harrow",
    workType: "Soil Preparation",
    unit: "ACRE",
    defaultRate: 1400,
    illustration: harrowSvg,
    description: "Breaks clods and cuts residue following heavy harvesting.",
  },
];

const VILLAGES_LIST = [
  "Ramakrishnapuram",
  "Lingampalli",
  "Kothapalli",
  "Venkatapalli",
  "Chintalapalli",
  "Rangampet",
  "Peddapalli",
  "Mallampet",
  "Mancherial",
];

export function AddWorkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const options = useJobOptions();
  const [params] = useSearchParams();

  // Workflow Step: 0: Select Farmer, 1: Choose Machinery, 2: Work Details, 3: Review, 4: Done
  const [step, setStep] = useState<number>(() => {
    // If farmerId is supplied via URL (e.g. from farmers list), we can jump straight to Step 1 or 2
    const initialFarmerId = params.get("farmerId");
    const initialStep = params.get("step");
    if (initialStep !== null) return parseInt(initialStep, 10);
    return initialFarmerId ? 2 : 0;
  });

  // Farmer Selection State
  const [farmerId, setFarmerId] = useState<string>(() => params.get("farmerId") ?? "");
  const [farmerSearch, setFarmerSearch] = useState<string>("");
  const [showQuickAddFarmer, setShowQuickAddFarmer] = useState(false);
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newFarmerPhone, setNewFarmerPhone] = useState("");
  const [newFarmerVillage, setNewFarmerVillage] = useState("");

  // Machinery Selection State
  const [selectedMachineryId, setSelectedMachineryId] = useState<string>("");

  // Work Details State matching exact reference image
  const [workDate, setWorkDate] = useState<string>(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const [village, setVillage] = useState<string>("");
  const [unitMode, setUnitMode] = useState<PricingUnit>("ACRE");
  const [quantity, setQuantity] = useState<string>("");
  const [operatingHours, setOperatingHours] = useState<string>("");
  const [pricingMode, setPricingMode] = useState<"DEFAULT_RATE" | "CUSTOM_RATE">("DEFAULT_RATE");
  const [customRate, setCustomRate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [fieldLocation, setFieldLocation] = useState<string>("");

  // Status & Submission State
  const [workState, setWorkState] = useState<"COMPLETED" | "DRAFT">("COMPLETED");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [savedJob, setSavedJob] = useState<Job | null>(null);

  // Selected machinery details
  const machineryOptions = useMemo(() => options.services.map((service) => {
    const template = MACHINERY_OPTIONS.find((item) => item.name === service.name);
    return { id: service.id, serviceId: service.id, name: service.name,
      workType: template?.workType ?? service.name, unit: service.unit,
      defaultRate: service.defaultRatePaise / 100,
      illustration: template?.illustration ?? tractorSvg,
      secondaryIllustration: template?.secondaryIllustration,
      description: template?.description ?? "Configured service using your registered equipment." };
  }), [options.services]);
  useEffect(() => { if (machineryOptions.length && !machineryOptions.some((item) => item.id === selectedMachineryId)) { setSelectedMachineryId(machineryOptions[0].id); setUnitMode(machineryOptions[0].unit); setQuantity(machineryOptions[0].unit === "TRIP" || machineryOptions[0].unit === "FIXED" ? "1" : ""); } }, [machineryOptions, selectedMachineryId]);
  const selectedMachinery = useMemo(() => {
    return (
      machineryOptions.find((m) => m.id === selectedMachineryId) ||
      MACHINERY_OPTIONS[0]
    );
  }, [selectedMachineryId, machineryOptions]);

  // Selected farmer object
  const selectedFarmer = useMemo(() => {
    const found = options.farmers.find((item) => item.id === farmerId);
    if (found) return found;
    // Default fallback to reference farmer Raju Yadav if farmerId is FARM-011 or not yet loaded
    if (farmerId === "FARM-011" || (!farmerId && options.farmers.length > 0)) {
      const raju = options.farmers.find(
        (item) => item.name.startsWith("Raju") || item.name.includes("Raju Yadav"),
      );
      if (raju) return raju;
    }
    return undefined;
  }, [options.farmers, farmerId]);

  // When farmer is selected, auto-fill village if not already customized
  useEffect(() => {
    if (selectedFarmer?.village) {
      setVillage(selectedFarmer.village);
    }
  }, [selectedFarmer]);

  // If no farmerId was provided in URL on load, but we find Raju Yadav in options, auto-select for initial view
  useEffect(() => {
    if (!farmerId && options.farmers.length > 0) {
      const raju = options.farmers.find(
        (f) => f.name.startsWith("Raju") || f.name.includes("Raju Yadav"),
      );
      if (raju) {
        setFarmerId(raju.id);
        setVillage(raju.village);
      } else {
        setFarmerId(options.farmers[0].id);
        setVillage(options.farmers[0].village);
      }
    }
  }, [options.farmers, farmerId]);

  // Calculate Rate & Total
  const currentRate = useMemo(() => {
    if (pricingMode === "DEFAULT_RATE") {
      return selectedMachinery.defaultRate;
    }
    const parsed = parseFloat(customRate.replace(/,/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }, [pricingMode, selectedMachinery.defaultRate, customRate]);

  const currentTotalPaise = useMemo(() => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    return Math.round(qty * currentRate * 100);
  }, [quantity, currentRate]);

  // Filtered farmers for Step 1
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return options.farmers;
    const term = farmerSearch.toLowerCase();
    return options.farmers.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.village.toLowerCase().includes(term) ||
        (f.mobile && f.mobile.includes(term)),
    );
  }, [options.farmers, farmerSearch]);

  // Handle Quick Add Farmer
  async function handleAddQuickFarmer(e: React.FormEvent) {
    e.preventDefault();
    if (!newFarmerName.trim() || !newFarmerVillage.trim()) { setError("Enter the farmer's name and village."); return; }
    try {
      const farmer = await farmersClient.save({ name: newFarmerName.trim(), village: newFarmerVillage.trim(), ...(newFarmerPhone.trim() && { mobile: newFarmerPhone.trim() }) });
      options.farmers.unshift({ id: farmer.id, name: farmer.name, village: farmer.village, mobile: farmer.mobile });
      setFarmerId(farmer.id);
      setVillage(farmer.village);
      setShowQuickAddFarmer(false);
      setNewFarmerName("");
      setNewFarmerPhone("");
      setNewFarmerVillage("");
      setError("");
    } catch { setError("Could not save farmer. Please try again."); }
  }

  // Navigation between steps with validation
  function handleNextStep() {
    setError("");
    if (step === 0) {
      if (!farmerId) {
        setError("Please select a farmer to proceed.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!selectedMachineryId) {
        setError("Please choose a machinery combination.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError("Please enter a valid area / duration.");
        return;
      }
      if (currentRate <= 0) {
        setError("Please specify a valid pricing rate.");
        return;
      }
      if (!workDate) {
        setError("Please choose a work date.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      void handleSaveWork();
    }
  }

  function handlePrevStep() {
    setError("");
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  }

  // Save work to API
  async function handleSaveWork() {
    try {
      setBusy(true);
      setError("");

      // Find matching or fallback service in backend options
      const matchingService = options.services.find((s) => s.id === selectedMachinery.serviceId);

      if (!matchingService) {
        throw new Error("No service found in catalog. Please check machinery setup.");
      }

      const normalizedDate = workDate;

      const input: JobInput = jobInputSchema.parse({
        farmerId: farmerId || options.farmers[0]?.id || "FARM-001",
        workDate: normalizedDate,
        village: village || "Ramakrishnapuram",
        fieldLocation: fieldLocation || undefined,
        notes: notes || undefined,
        state: workState,
        lines: [
          {
            serviceId: matchingService.id,
            equipmentIds: matchingService.equipmentIds,
            unit: matchingService.unit,
            quantity: quantity,
            ...(operatingHours && { operatingHours }),
            pricingMode: pricingMode === "CUSTOM_RATE" ? "CUSTOM_RATE" : "DEFAULT_RATE",
            ...(pricingMode === "CUSTOM_RATE" && {
              agreedRatePaise: parseRupees(String(currentRate)),
            }),
            ...(notes && { reason: notes }),
          },
        ],
      });

      const result = await jobClient.save(input);
      setSavedJob(result);
      setStep(4); // Move to Done view
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (options.loading && options.farmers.length === 0) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Bar matching reference image */}
      <div className="flex items-center gap-3.5 mb-2">
        <button
          type="button"
          onClick={handlePrevStep}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 shadow-xs transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 stroke-[2.2]" />
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
            Add Work
          </h1>
          <p className="text-sm text-gray-500 font-normal">
            Record a new work for a farmer
          </p>
        </div>
      </div>

      {/* 2. 5-Step Progress Stepper */}
      <AddWorkStepper currentStep={step} onStepClick={(s) => setStep(s)} />

      {/* Error message banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 animate-fadeIn"
        >
          <Info className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main Workspace: Two-Column Layout (Step 0 to 3) or Success Card (Step 4) */}
      {step === 4 ? (
        /* STEP 5: SUCCESS & CONFIRMATION */
        <div className="max-w-2xl mx-auto mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center animate-fadeIn">
          <div className="w-18 h-18 mx-auto rounded-full bg-green-100 text-[#16812F] flex items-center justify-center mb-5 ring-8 ring-green-50 shadow-xs">
            <Check className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Work Recorded Successfully!
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
            The work details have been saved and added to the farmer's account.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#075C2D] font-semibold text-xs tracking-wider uppercase mt-4">
            <Sparkles className="w-3.5 h-3.5 text-[#16812F]" />
            <span>Ref: {savedJob?.id || "New work"}</span>
          </div>

          {/* Mini Summary Box */}
          <div className="my-6 bg-gray-50/80 rounded-xl border border-gray-200/80 p-5 text-left max-w-md mx-auto space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Farmer:</span>
              <span className="font-bold text-gray-900">
                {selectedFarmer?.name || "Raju Yadav"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Village:</span>
              <span className="font-medium text-gray-800">{village}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Machinery:</span>
              <span className="font-medium text-gray-800">{selectedMachinery.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Work Date:</span>
              <span className="font-medium text-gray-800">{workDate}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
              <span className="text-gray-900">Total Work Value:</span>
              <span className="text-[#075C2D] text-lg">
                ₹ {Math.round(currentTotalPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>View Work Records</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setStep(0);
                setSavedJob(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#16812F] font-semibold text-sm text-[#16812F] hover:bg-green-50 shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#16812F]" />
              <span>Add Another Work</span>
            </button>

            <Link
              to={`/invoices`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#075C2D] font-bold text-sm text-white hover:bg-[#064B24] shadow-sm transition-colors"
            >
              <ReceiptText className="w-4 h-4 text-white" />
              <span>Generate Invoice</span>
            </Link>
          </div>
        </div>
      ) : (
        /* 2-COLUMN WORKSPACE: LEFT FORM CARD + RIGHT STICKY SUMMARY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ACTIVE STEP CARD (~64% width) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-7">
              {/* STEP 1: SELECT FARMER */}
              {step === 0 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Step Card Header */}
                  <div className="flex items-start gap-3.5 pb-5 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        Select Farmer
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Choose the farmer for whom this machinery work is being performed
                      </p>
                    </div>
                  </div>

                  {/* Search bar & Add Farmer button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        placeholder="Search farmer by name, phone or village..."
                        value={farmerSearch}
                        onChange={(e) => setFarmerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100 bg-gray-50/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddFarmer(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16812F] text-white font-semibold text-xs sm:text-sm hover:bg-[#126b27] shadow-xs transition-colors shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Farmer</span>
                    </button>
                  </div>

                  {/* Quick Add Farmer Modal / Inline Form */}
                  {showQuickAddFarmer && (
                    <form
                      onSubmit={handleAddQuickFarmer}
                      className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#075C2D]">
                          Quick Add Farmer
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddFarmer(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Farmer Name *"
                          value={newFarmerName}
                          onChange={(e) => setNewFarmerName(e.target.value)}
                          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#16812F]"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={newFarmerPhone}
                          onChange={(e) => setNewFarmerPhone(e.target.value)}
                          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#16812F]"
                        />
                        <input
                          type="text"
                          placeholder="Village / Location"
                          value={newFarmerVillage}
                          onChange={(e) => setNewFarmerVillage(e.target.value)}
                          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#16812F]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddFarmer(false)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-bold text-white bg-[#16812F] rounded-lg hover:bg-[#126b27]"
                        >
                          Save & Select
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Farmers Selection Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredFarmers.map((f) => {
                      const isSelected = f.id === farmerId;
                      const initial = f.name.charAt(0).toUpperCase();

                      return (
                        <div
                          key={f.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setFarmerId(f.id);
                            setVillage(f.village);
                            setError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setFarmerId(f.id);
                              setVillage(f.village);
                              setError("");
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                            isSelected
                              ? "bg-[#E8F8EC] border-[#16812F] ring-1.5 ring-[#16812F] shadow-xs"
                              : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                isSelected
                                  ? "bg-[#16812F] text-white"
                                  : "bg-emerald-100 text-[#16812F]"
                              }`}
                            >
                              {initial}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1 pr-5">
                              <h4 className="font-bold text-sm text-gray-900 truncate">
                                {f.name}
                              </h4>
                              {f.mobile && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>+91 {f.mobile}</span>
                                </p>
                              )}
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{f.village}</span>
                              </p>
                            </div>

                            {/* Selection Radio / Check Circle */}
                            <div className="absolute top-3.5 right-3.5">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? "bg-[#16812F] border-[#16812F] text-white"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE MACHINERY */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Step Card Header */}
                  <div className="flex items-start gap-3.5 pb-5 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        Choose Machinery & Service
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Select the equipment combination and work type to be deployed
                      </p>
                    </div>
                  </div>

                  {/* Machinery Selection Cards */}
                  {machineryOptions.length === 0 && <p role="alert">No configured services. Register your equipment and create a service in Machinery &amp; Tools first.</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {machineryOptions.map((machinery) => {
                      const isSelected = machinery.id === selectedMachineryId;

                      return (
                        <div
                          key={machinery.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedMachineryId(machinery.id);
                            setUnitMode(machinery.unit);
                            setQuantity(machinery.unit === "TRIP" || machinery.unit === "FIXED" ? "1" : "");
                            setError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedMachineryId(machinery.id);
                              setUnitMode(machinery.unit);
                              setQuantity(machinery.unit === "TRIP" || machinery.unit === "FIXED" ? "1" : "");
                              setError("");
                            }
                          }}
                          className={`rounded-2xl border p-4 text-left cursor-pointer transition-all duration-150 relative ${
                            isSelected
                              ? "bg-[#E8F8EC] border-[#16812F] ring-1.5 ring-[#16812F] shadow-sm"
                              : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/20"
                          }`}
                        >
                          {/* Illustration Box */}
                          <div className="h-24 bg-gray-50/70 rounded-xl p-2 flex items-center justify-center gap-2 mb-3 border border-gray-100">
                            <img
                              src={machinery.illustration}
                              alt={machinery.name}
                              className="h-16 max-w-[80px] object-contain"
                            />
                            {machinery.secondaryIllustration && (
                              <>
                                <span className="text-gray-400 font-bold text-sm">+</span>
                                <img
                                  src={machinery.secondaryIllustration}
                                  alt=""
                                  className="h-16 max-w-[80px] object-contain"
                                />
                              </>
                            )}
                          </div>

                          {/* Info */}
                          <div className="pr-6">
                            <h4 className="font-bold text-sm text-gray-900 leading-tight">
                              {machinery.name}
                            </h4>
                            <p className="text-xs text-[#075C2D] font-medium mt-0.5">
                              {machinery.workType}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                              {machinery.description}
                            </p>

                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-800">
                              <span>Default: ₹ {machinery.defaultRate.toLocaleString("en-IN")}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-500 lowercase">
                                {machinery.unit}
                              </span>
                            </div>
                          </div>

                          {/* Radio Selector Icon */}
                          <div className="absolute top-4 right-4">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? "bg-[#16812F] border-[#16812F] text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: WORK DETAILS (EXACT MATCH TO add work.jpeg) */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Step Card Header */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        Work Details
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Enter area, pricing and work information
                      </p>
                    </div>
                  </div>

                  {/* ROW 1: Work Date * & Village / Location * */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Work Date */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        Work Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          value={workDate}
                          onChange={(e) => setWorkDate(e.target.value)}
                          placeholder="e.g. Jan 26, 2025"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                    </div>

                    {/* Village / Location */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        Village / Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100 appearance-none cursor-pointer"
                        >
                          {VILLAGES_LIST.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                          {village && !VILLAGES_LIST.includes(village) && (
                            <option value={village}>{village}</option>
                          )}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ROW 2: Area / Duration * & Quantity Input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Area / Duration Radios */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        Area / Duration <span className="text-red-500">*</span>
                      </label>
                      {(unitMode === "TRIP" || unitMode === "FIXED") && <p className="text-sm text-[#075C2D] font-semibold mb-2">{unitMode === "TRIP" ? "Transport trips" : "Fixed service"}</p>}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Option: Acres (Area) */}
                        <button
                          type="button"
                          disabled={selectedMachinery.unit !== "ACRE"}
                          onClick={() => setUnitMode("ACRE")}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            unitMode === "ACRE"
                              ? "bg-[#E5F6E6] border-[#16812F] text-[#075C2D] font-bold"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              unitMode === "ACRE"
                                ? "border-[#16812F] bg-[#16812F]"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {unitMode === "ACRE" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span>Acres (Area)</span>
                        </button>

                        {/* Option: Hours */}
                        <button
                          type="button"
                          disabled={selectedMachinery.unit !== "HOUR"}
                          onClick={() => setUnitMode("HOUR")}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            unitMode === "HOUR"
                              ? "bg-[#E5F6E6] border-[#16812F] text-[#075C2D] font-bold"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              unitMode === "HOUR"
                                ? "border-[#16812F] bg-[#16812F]"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {unitMode === "HOUR" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span>Hours</span>
                        </button>
                      </div>
                    </div>

                    {/* Numeric Quantity Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        {unitMode === "ACRE" ? "Acres" : unitMode === "HOUR" ? "Hours" : unitMode === "TRIP" ? "Trips" : "Quantity"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g. 3.50"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 lowercase pointer-events-none">
                          {unitMode === "ACRE" ? "acres" : unitMode === "HOUR" ? "hours" : unitMode === "TRIP" ? "trips" : "unit"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <label className="block text-xs sm:text-sm font-semibold text-gray-800">Actual operating hours (optional)
                    <input type="number" min="0" step="0.1" value={operatingHours} onChange={(event) => setOperatingHours(event.target.value)} className="block w-full max-w-xs mt-1.5 px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm" />
                  </label>
                  {/* ROW 3: Pricing * & Rate per Acre (₹) * */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pricing Mode Radio Cards */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        Pricing <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Option: Default Rate */}
                        <button
                          type="button"
                          onClick={() => setPricingMode("DEFAULT_RATE")}
                          className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                            pricingMode === "DEFAULT_RATE"
                              ? "bg-[#E5F6E6] border-[#16812F] text-[#075C2D]"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                pricingMode === "DEFAULT_RATE"
                                  ? "border-[#16812F] bg-[#16812F]"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {pricingMode === "DEFAULT_RATE" && (
                                <div className="w-1 h-1 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                              Default Rate
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 ml-5 mt-0.5">
                            ₹ {selectedMachinery.defaultRate.toLocaleString("en-IN")} /{" "}
                            {selectedMachinery.unit.toLowerCase()}
                          </span>
                        </button>

                        {/* Option: Custom Rate */}
                        <button
                          type="button"
                          onClick={() => setPricingMode("CUSTOM_RATE")}
                          className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                            pricingMode === "CUSTOM_RATE"
                              ? "bg-[#E5F6E6] border-[#16812F] text-[#075C2D]"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                pricingMode === "CUSTOM_RATE"
                                  ? "border-[#16812F] bg-[#16812F]"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {pricingMode === "CUSTOM_RATE" && (
                                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold">
                              Custom Rate
                            </span>
                          </div>
                          <span className="text-xs text-green-800 ml-5 mt-0.5 font-medium">
                            ₹ {customRate || "1,700"} /{" "}
                            {unitMode.toLowerCase()}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Rate Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                        {"Rate per " + (unitMode === "ACRE" ? "Acre" : unitMode === "HOUR" ? "Hour" : unitMode === "TRIP" ? "Trip" : "Service") + " (₹)"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            pricingMode === "DEFAULT_RATE"
                              ? selectedMachinery.defaultRate.toLocaleString("en-IN")
                              : customRate
                          }
                          disabled={pricingMode === "DEFAULT_RATE"}
                          onChange={(e) => setCustomRate(e.target.value)}
                          className={`w-full pl-8 pr-3.5 py-2.5 border rounded-xl text-sm font-semibold text-gray-900 focus:outline-none ${
                            pricingMode === "DEFAULT_RATE"
                              ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                              : "bg-white border-gray-300 focus:border-[#16812F] focus:ring-2 focus:ring-green-100"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ROW 4: CALCULATION BANNER matching add work.jpeg */}
                  <div className="bg-[#DDF5DF] border border-[#BEE7C4] rounded-xl px-4 py-3 flex items-center gap-2.5 text-[#075C2D] font-semibold text-xs sm:text-sm">
                    <Info className="w-4 h-4 text-[#16812F] shrink-0" />
                    <span>
                      Total Amount = {quantity || "0"} {unitMode.toLowerCase()} × ₹{" "}
                      {currentRate.toLocaleString("en-IN")} = ₹{" "}
                      {Math.round(currentTotalPaise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* ROW 5: Additional Details (Optional) */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                      <FileEdit className="w-3.5 h-3.5 text-gray-500" />
                      <span>Additional Details (Optional)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        maxLength={200}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="South field, sandy soil. Extra pass done."
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100 placeholder:text-gray-400 resize-none"
                      />
                      <span className="absolute right-3 bottom-2.5 text-xs text-gray-400 font-medium">
                        {notes.length} / 200
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW WORK DETAILS */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Step Card Header */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        Review & Confirm Work
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Verify all details before saving to records and updating ledger
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Farmer Review */}
                  <div className="bg-gray-50/70 border border-gray-200/90 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Farmer Details
                      </span>
                      <h4 className="font-bold text-base text-gray-900 mt-1">
                        {selectedFarmer?.name || "Raju Yadav"}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          +91 {selectedFarmer?.mobile || "98765 43210"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {village}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#16812F] hover:text-[#075C2D] bg-white border border-green-200 px-2.5 py-1 rounded-lg"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Section 2: Machinery & Service Review */}
                  <div className="bg-gray-50/70 border border-gray-200/90 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Machinery & Service
                      </span>
                      <h4 className="font-bold text-base text-gray-900 mt-1">
                        {selectedMachinery.name}
                      </h4>
                      <p className="text-xs text-[#075C2D] font-medium mt-0.5">
                        {selectedMachinery.workType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#16812F] hover:text-[#075C2D] bg-white border border-green-200 px-2.5 py-1 rounded-lg"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Section 3: Work & Pricing Details Review */}
                  <div className="bg-gray-50/70 border border-gray-200/90 rounded-xl p-4 flex items-start justify-between">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Work & Pricing
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 pt-1">
                        <div>
                          <span className="text-gray-400 block text-xs">Date:</span>
                          <span className="font-semibold text-gray-900">{workDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xs">Location:</span>
                          <span className="font-semibold text-gray-900">{village}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xs">Quantity:</span>
                          <span className="font-semibold text-gray-900">
                            {quantity} {unitMode.toLowerCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xs">Rate:</span>
                          <span className="font-semibold text-gray-900">
                            ₹ {currentRate.toLocaleString("en-IN")}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              ({pricingMode === "CUSTOM_RATE" ? "Custom" : "Default"})
                            </span>
                          </span>
                        </div>
                      </div>

                      {notes && (
                        <div className="pt-2 text-xs text-gray-600 border-t border-gray-200 mt-2">
                          <span className="font-medium text-gray-700">Notes:</span> {notes}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#16812F] hover:text-[#075C2D] bg-white border border-green-200 px-2.5 py-1 rounded-lg shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Status Options */}
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#075C2D] font-medium">
                      <Clock className="w-4 h-4 text-[#16812F]" />
                      <span>Work Status:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkState("COMPLETED")}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                          workState === "COMPLETED"
                            ? "bg-[#16812F] text-white"
                            : "bg-white text-gray-600 border border-gray-200"
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkState("DRAFT")}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                          workState === "DRAFT"
                            ? "bg-[#16812F] text-white"
                            : "bg-white text-gray-600 border border-gray-200"
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD FOOTER NAVIGATION BUTTONS matching exact buttons in add work.jpeg */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                {/* Left: Previous Button */}
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-[#16812F] text-[#16812F] font-semibold text-sm hover:bg-green-50 transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Right: Next / Submit Button */}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#075C2D] hover:bg-[#064B24] text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <span>
                      {step === 0
                        ? "Next: Choose Machinery"
                        : step === 1
                        ? "Next: Work Details"
                        : "Next: Review"}
                    </span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#075C2D] hover:bg-[#064B24] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                  >
                    {busy ? (
                      <span>Saving Work...</span>
                    ) : (
                      <>
                        <span>Confirm & Save Work</span>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY WORK SUMMARY PANEL (~36% width) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <AddWorkSummary
              farmer={selectedFarmer}
              machineryName={selectedMachinery.name}
              workType={selectedMachinery.workType}
              workDate={workDate}
              unit={unitMode}
              quantity={quantity}
              rate={currentRate}
              totalPaise={currentTotalPaise}
            />
          </div>
        </div>
      )}
    </div>
  );
}
