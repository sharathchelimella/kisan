import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Ellipsis,
  Plus,
  Search,
  Tractor,
  Wrench,
} from "lucide-react";
import type {
  Equipment,
  EquipmentInput,
  EquipmentWork,
} from "@kisan/contracts";
import { catalogClient } from "../../services/catalog";
import { authClient } from "../../services/auth";
import { equipmentModelSuggestions } from "../../models/equipment-model-catalog";

const categories = [
  {
    kind: "TRACTOR",
    label: "Tractor",
    image: "tractor",
    brands: [
      "Mahindra",
      "Swaraj",
      "John Deere",
      "Sonalika",
      "New Holland",
      "Massey Ferguson",
      "Eicher",
      "Farmtrac",
      "Kubota",
      "TAFE",
    ],
  },
  {
    kind: "ROTAVATOR",
    label: "Rotavator",
    image: "rotavator",
    brands: ["Shaktiman", "Fieldking", "Maschio Gaspardo"],
  },
  {
    kind: "PLOUGH",
    label: "MB Plough",
    image: "plough",
    brands: ["Fieldking", "Shaktiman", "Garud"],
  },
  {
    kind: "CULTIVATOR",
    label: "Cultivator",
    image: "cultivator",
    brands: ["Fieldking", "Shaktiman", "Garud"],
  },
  {
    kind: "HARROW",
    label: "Disc Harrow",
    image: "harrow",
    brands: ["Fieldking", "Shaktiman", "Maschio Gaspardo"],
  },
  {
    kind: "TROLLEY",
    label: "Trailer / Trolley",
    image: "trolley",
    brands: ["Swaraj", "Garud", "Other Brand"],
  },
  {
    kind: "CUSTOM",
    label: "Other Equipment",
    image: "other",
    brands: ["Other Brand"],
  },
] as const;
const imageFor = (kind: string) =>
  "/equipment/" +
  (categories.find((entry) => entry.kind === kind)?.image ?? "other") +
  ".webp";
const labelFor = (kind: string) =>
  categories.find((entry) => entry.kind === kind)?.label ?? kind;
const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
const num = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
const emptyWork = (id: string): EquipmentWork => ({
  equipmentId: id,
  completedJobs: 0,
  associatedWorkPaise: 0,
  operatingHours: 0,
  operatingHoursComplete: true,
  serviceAcres: 0,
  trips: 0,
  trend: [],
  partners: [],
  history: [],
});
const statusLabel = (item: Equipment) =>
  !item.active
    ? "Archived"
    : item.status === "MAINTENANCE"
      ? "Under Maintenance"
      : item.status === "INACTIVE"
        ? "Inactive"
        : item.status === "AVAILABLE"
          ? "Available"
          : "Active";
function dateInZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function bounds(
  period: string,
  timeZone: string,
  from: string,
  to: string,
): [string | undefined, string | undefined] {
  const today = dateInZone(timeZone);
  const [y, m, d] = today.split("-").map(Number);
  const day = (offset: number) =>
    new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
  if (period === "today") return [today, today];
  if (period === "week") {
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return [day(-((weekday + 6) % 7)), today];
  }
  if (period === "month") return [today.slice(0, 7) + "-01", today];
  if (period === "lastMonth") {
    const first = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    return [first, new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10)];
  }
  if (period === "year") return [String(y) + "-01-01", today];
  if (period === "custom") return [from || undefined, to || undefined];
  return [undefined, undefined];
}

async function imageData(file: File): Promise<string> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 8_000_000
  )
    throw new Error("Choose a JPEG, PNG, or WebP photo under 8 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width, 900 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = canvas.toDataURL("image/webp", 0.76);
  if (data.length > 700000)
    throw new Error("Photo is still too large. Choose a smaller image.");
  return data;
}

function EquipmentWizard({
  item,
  onClose,
  onSaved,
}: {
  item?: Equipment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(item ? 4 : 1);
  const [form, setForm] = useState<EquipmentInput>({
    name: item?.name ?? "",
    kind: item?.kind ?? "TRACTOR",
    brand: item?.brand ?? "",
    model: item?.model ?? "",
    active: item?.active ?? true,
    status: item?.status ?? "ACTIVE",
    serialOrRegistration: item?.serialOrRegistration ?? "",
    serialNumber: item?.serialNumber ?? "",
    purchaseDate: item?.purchaseDate,
    purchaseCostPaise: item?.purchaseCostPaise,
    notes: item?.notes,
    lastServiceDate: item?.lastServiceDate,
    nextMaintenanceDate: item?.nextMaintenanceDate,
    horsepower: item?.horsepower,
    driveType: item?.driveType,
    implementSize: item?.implementSize,
    capacity: item?.capacity,
    photoDataUrl: item?.photoDataUrl,
  });
  const [cost, setCost] = useState(
    item?.purchaseCostPaise ? String(item.purchaseCostPaise / 100) : "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const category =
    categories.find((entry) => entry.kind === form.kind) ?? categories[6];
  const update = (patch: Partial<EquipmentInput>) =>
    setForm((current) => ({ ...current, ...patch }));
  const next = () => {
    setError("");
    if (step === 4 && !form.name.trim()) {
      setError("Enter an equipment name.");
      return;
    }
    setStep((value) => Math.min(5, value + 1));
  };
  async function save() {
    setBusy(true);
    setError("");
    try {
      await catalogClient.saveEquipment(
        {
          ...form,
          name: form.name.trim(),
          brand: form.brand?.trim(),
          model: form.model?.trim(),
          purchaseCostPaise: cost ? Math.round(Number(cost) * 100) : undefined,
        },
        item?.id,
      );
      onSaved();
    } catch {
      setError("Could not save equipment. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="machine-wizard-backdrop" role="presentation">
      <section
        className="machine-wizard"
        role="dialog"
        aria-modal="true"
        aria-label={item ? "Edit equipment" : "Add Equipment"}
      >
        <div className="machine-wizard-head">
          <div>
            <small>MY EQUIPMENT · STEP {step} OF 5</small>
            <h2>{item ? "Edit Equipment" : "Add Equipment"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="machine-steps">
          {["Category", "Brand", "Model", "Details", "Confirm"].map(
            (name, index) => (
              <span key={name} className={step === index + 1 ? "current" : ""}>
                {index + 1}. {name}
              </span>
            ),
          )}
        </div>
        {step === 1 && (
          <div className="machine-category-grid">
            {categories.map((entry) => (
              <button
                type="button"
                key={entry.kind}
                className={form.kind === entry.kind ? "chosen" : ""}
                onClick={() => update({ kind: entry.kind })}
              >
                <img src={imageFor(entry.kind)} alt="" />
                <strong>{entry.label}</strong>
                <small>Representative image</small>
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div>
            <p>
              Choose a brand for your {category.label.toLowerCase()}, or enter
              your own.
            </p>
            <div className="machine-brand-grid">
              {category.brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={form.brand === brand ? "chosen" : ""}
                  onClick={() => update({ brand })}
                >
                  {brand}
                </button>
              ))}
            </div>
            <label>
              Other brand
              <input
                value={form.brand ?? ""}
                onChange={(event) => update({ brand: event.target.value })}
                placeholder="Enter brand"
              />
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="machine-form">
            <p>
              Enter the exact model from your machine. Its specifications can be
              added in the next step.
            </p>
            {(equipmentModelSuggestions[form.kind]?.[form.brand ?? ""] ?? [])
              .length > 0 && (
              <div className="machine-form-wide machine-brand-grid">
                {(
                  equipmentModelSuggestions[form.kind]?.[form.brand ?? ""] ?? []
                ).map((model) => (
                  <button
                    type="button"
                    key={model}
                    className={form.model === model ? "chosen" : ""}
                    onClick={() => update({ model })}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
            <label>
              Model
              <input
                value={form.model ?? ""}
                onChange={(event) => update({ model: event.target.value })}
                placeholder="Model or custom equipment"
              />
            </label>
          </div>
        )}
        {step === 4 && (
          <div className="machine-form">
            <label>
              Name *
              <input
                value={form.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="e.g. My 575 DI tractor"
              />
            </label>
            <label>
              Registration number
              <input
                value={form.serialOrRegistration ?? ""}
                onChange={(event) =>
                  update({ serialOrRegistration: event.target.value })
                }
              />
            </label>
            <label>
              Serial number
              <input
                value={form.serialNumber ?? ""}
                onChange={(event) =>
                  update({ serialNumber: event.target.value })
                }
              />
            </label>
            <label>
              Purchase date
              <input
                type="date"
                value={form.purchaseDate ?? ""}
                onChange={(event) =>
                  update({ purchaseDate: event.target.value || undefined })
                }
              />
            </label>
            <label>
              Purchase cost (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  update({
                    status: event.target.value as EquipmentInput["status"],
                  })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label>
              Horsepower
              <input
                type="number"
                min="0"
                value={form.horsepower ?? ""}
                onChange={(event) =>
                  update({
                    horsepower: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
              />
            </label>
            <label>
              Drive type
              <input
                value={form.driveType ?? ""}
                onChange={(event) => update({ driveType: event.target.value })}
              />
            </label>
            <label>
              Implement size
              <input
                value={form.implementSize ?? ""}
                onChange={(event) =>
                  update({ implementSize: event.target.value })
                }
              />
            </label>
            <label>
              Capacity
              <input
                value={form.capacity ?? ""}
                onChange={(event) => update({ capacity: event.target.value })}
              />
            </label>
            <label>
              Last service date
              <input
                type="date"
                value={form.lastServiceDate ?? ""}
                onChange={(event) =>
                  update({ lastServiceDate: event.target.value || undefined })
                }
              />
            </label>
            <label>
              Next maintenance date
              <input
                type="date"
                value={form.nextMaintenanceDate ?? ""}
                onChange={(event) =>
                  update({
                    nextMaintenanceDate: event.target.value || undefined,
                  })
                }
              />
            </label>
            <label className="machine-form-wide">
              Notes
              <textarea
                value={form.notes ?? ""}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </label>
            <label className="machine-form-wide">
              Actual equipment photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    void imageData(file).then(
                      (photoDataUrl) => {
                        update({ photoDataUrl });
                        setError("");
                      },
                      (reason) => setError(String(reason.message)),
                    );
                }}
              />
            </label>
          </div>
        )}
        {step === 5 && (
          <div className="machine-preview">
            <img src={form.photoDataUrl || imageFor(form.kind)} alt="" />
            <div>
              <h3>{form.name}</h3>
              <p>
                {form.brand} {form.model} · {labelFor(form.kind)}
              </p>
              <p>{form.serialOrRegistration || "No registration number"}</p>
              <p>
                {form.photoDataUrl ? "Owner photo" : "Representative image"}
              </p>
              <p>Performance begins at zero and updates from completed work.</p>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="machine-error">
            {error}
          </p>
        )}
        <div className="machine-wizard-actions">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            onClick={step === 5 ? () => void save() : next}
            disabled={busy}
          >
            {step === 5 ? (busy ? "Saving…" : "Confirm and add") : "Continue"}
          </button>
        </div>
      </section>
    </div>
  );
}

function EquipmentDetails({
  item,
  work,
  allWork,
  all,
  period,
  setPeriod,
  from,
  setFrom,
  to,
  setTo,
  select,
  timeZone,
  edit,
  toggleArchive,
  periodFrom,
  periodTo,
  saveAvailability,
}: {
  item: Equipment;
  work: EquipmentWork;
  allWork: EquipmentWork;
  all: Equipment[];
  period: string;
  setPeriod: (value: string) => void;
  from: string;
  setFrom: (value: string) => void;
  to: string;
  setTo: (value: string) => void;
  select: (id: string) => void;
  timeZone: string;
  edit: () => void;
  toggleArchive: () => void;
  periodFrom?: string;
  periodTo?: string;
  saveAvailability: (hours: number) => Promise<void>;
}) {
  const [mode, setMode] = useState("workPaise");
  const [months, setMonths] = useState(6);
  const [availableInput, setAvailableInput] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const series = work.trend.slice(-months);
  const maximum = Math.max(
    1,
    ...series.map((entry) => Number(entry[mode as keyof typeof entry])),
  );
  const isTractor = item.kind === "TRACTOR";
  const today = dateInZone(timeZone);
  const monthValue = allWork.trend
    .filter((entry) => entry.month === today.slice(0, 7))
    .reduce((sum, entry) => sum + entry.workPaise, 0);
  const yearValue = allWork.trend
    .filter((entry) => entry.month.startsWith(today.slice(0, 4)))
    .reduce((sum, entry) => sum + entry.workPaise, 0);
  return (
    <aside className="machine-detail">
      <div className="machine-detail-head">
        <img
          src={item.photoDataUrl || imageFor(item.kind)}
          alt={
            item.photoDataUrl
              ? item.name
              : "Representative " + labelFor(item.kind)
          }
        />
        <div>
          <span className="machine-pill">{statusLabel(item)}</span>
          <h2>{item.name}</h2>
          <p>
            {item.brand} {item.model} · {labelFor(item.kind)}
          </p>
          <small>ID: {item.id}</small>
          <div className="machine-detail-actions">
            <button type="button" onClick={edit}>
              Edit
            </button>
            <button type="button" onClick={toggleArchive}>
              {item.active ? "Archive" : "Restore"}
            </button>
          </div>
        </div>
      </div>
      {!item.photoDataUrl && (
        <small className="machine-image-note">
          Representative category image · upload your actual machine photo in
          Edit
        </small>
      )}
      <div className="machine-specs">
        {[
          ["Registration", item.serialOrRegistration],
          ["Serial", item.serialNumber],
          ["Horsepower", item.horsepower ? item.horsepower + " HP" : undefined],
          ["Drive", item.driveType],
          ["Size", item.implementSize],
          ["Capacity", item.capacity],
        ]
          .filter((entry) => entry[1])
          .map(([name, value]) => (
            <span key={name}>
              {name}: <strong>{value}</strong>
            </span>
          ))}
      </div>
      <div className="machine-info">
        <Activity size={18} />
        <div>
          <strong>Included in Dashboard Analytics</strong>
          <p>
            Completed work using this equipment updates its performance and your
            business dashboard.
          </p>
        </div>
      </div>
      <div className="machine-period">
        <label>
          Reporting period
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </label>
        {period === "custom" && (
          <>
            <input
              type="date"
              aria-label="From date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <input
              type="date"
              aria-label="To date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </>
        )}
      </div>
      <div className="machine-metrics">
        <div>
          <small>This Month · Associated Work</small>
          <strong>{money(monthValue)}</strong>
        </div>
        <div>
          <small>This Year · Associated Work</small>
          <strong>{money(yearValue)}</strong>
        </div>
        <div>
          <small>Completed Jobs · Selected Period</small>
          <strong>{work.completedJobs}</strong>
        </div>
        <div>
          <small title="Work value linked to this equipment. The same job can appear on its tractor and tool; do not add equipment values for business revenue.">
            Associated Work Value · Selected Period ⓘ
          </small>
          <strong>{money(work.associatedWorkPaise)}</strong>
        </div>
        <div>
          <small>Recorded Operating Hours</small>
          <strong>{work.operatingHoursComplete ? num(work.operatingHours) : work.operatingHours > 0 ? num(work.operatingHours) + " recorded" : "Not recorded"}</strong>
        </div>
        {work.serviceAcres > 0 && (
          <div>
            <small>Service-acres</small>
            <strong>{num(work.serviceAcres)}</strong>
          </div>
        )}
        {work.trips > 0 && (
          <div>
            <small>Transport Trips</small>
            <strong>{num(work.trips)}</strong>
          </div>
        )}
        <div>
          <small>Utilization</small>
          <strong>
            {work.utilizationPct === undefined
              ? "Not enough data"
              : num(work.utilizationPct) + "%"}
          </strong>
        </div>
      </div>
      {work.utilizationPct !== undefined && (
        <div className="machine-utilization-track">
          <span style={{ width: Math.min(100, work.utilizationPct) + "%" }} />
        </div>
      )}
      <p className="machine-note">
        Utilization uses recorded operating hours divided by owner entered
        available hours for this exact period. Missing job hours keep it
        unavailable.
      </p>
      {periodFrom && periodTo && (
        <form
          className="machine-availability"
          onSubmit={(event) => {
            event.preventDefault();
            const hours = Number(availableInput);
            if (!Number.isFinite(hours) || hours < 0 || availableInput === "") {
              setAvailabilityError("Enter valid available hours.");
              return;
            }
            void saveAvailability(hours).then(
              () => {
                setAvailabilityError("");
                setAvailableInput("");
              },
              () => setAvailabilityError("Could not save available hours."),
            );
          }}
        >
          <label>
            Available hours · {periodFrom} to {periodTo}
            <input
              type="number"
              min="0"
              step="0.1"
              value={availableInput}
              onChange={(event) => setAvailableInput(event.target.value)}
              placeholder={
                work.availableHours === undefined
                  ? "Enter actual available hours"
                  : String(work.availableHours)
              }
            />
          </label>
          <button type="submit">Save hours</button>
          {availabilityError && <span role="alert">{availabilityError}</span>}
        </form>
      )}
      {(item.lastServiceDate || item.nextMaintenanceDate) && (
        <div className="machine-maintenance">
          <CalendarDays size={18} />
          <span>Last service: {item.lastServiceDate || "—"}</span>
          <span>Next maintenance: {item.nextMaintenanceDate || "—"}</span>
        </div>
      )}
      <div className="machine-section-title">
        <h3>Equipment Usage Trend</h3>
        <select
          aria-label="Chart metric"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          <option value="workPaise">Work value</option>
          <option value="hours">Hours</option>
          <option value="jobs">Jobs</option>
          <option value="acres">Service-acres</option>
          <option value="trips">Trips</option>
        </select>
        <select
          aria-label="Chart range"
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
        >
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
        </select>
      </div>
      {mode === "hours" && !work.operatingHoursComplete ? <p className="machine-empty-chart">Operating hours are incomplete for this period.</p> : series.length ? (
        <div className="machine-chart">
          {series.map((entry) => {
            const value = Number(entry[mode as keyof typeof entry]);
            return (
              <div
                key={entry.month}
                title={
                  entry.month +
                  ": " +
                  (mode === "workPaise" ? money(value) : num(value))
                }
              >
                <span>{mode === "workPaise" ? money(value) : num(value)}</span>
                <i
                  style={{ height: Math.max(4, (100 * value) / maximum) + "%" }}
                />
                <small>{entry.month.slice(5)}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="machine-empty-chart">No completed work in this period.</p>
      )}
      <h3>
        {isTractor
          ? "Work Breakdown by Attached Tools"
          : "Tractors Used With This Tool"}
      </h3>
      {work.partners.length ? (
        <div className="machine-partners">
          {work.partners
            .filter((entry) =>
              isTractor
                ? all.find((item) => item.id === entry.equipmentId)?.kind !==
                  "TRACTOR"
                : all.find((item) => item.id === entry.equipmentId)?.kind ===
                  "TRACTOR",
            )
            .map((entry) => {
              const partner = all.find(
                (candidate) => candidate.id === entry.equipmentId,
              );
              return (
                partner && (
                  <button
                    type="button"
                    key={partner.id}
                    onClick={() => select(partner.id)}
                  >
                    <img
                      src={partner.photoDataUrl || imageFor(partner.kind)}
                      alt=""
                    />
                    <span>
                      <strong>{partner.name}</strong>
                      <small>
                        {entry.jobs} jobs · {work.operatingHoursComplete ? num(entry.hours) + " hours" : "hours not fully recorded"} ·{" "}
                        {entry.acres
                          ? num(entry.acres) + " service-acres"
                          : entry.trips
                            ? num(entry.trips) + " trips"
                            : "—"}
                      </small>
                    </span>
                    <b>{money(entry.workPaise)}</b>
                  </button>
                )
              );
            })}
        </div>
      ) : (
        <p className="machine-muted">
          No linked completed work in this period.
        </p>
      )}
      <div className="machine-section-title">
        <h3>Work History</h3>
        <span>{work.history.length} service lines</span>
      </div>
      <div className="machine-history">
        {work.history.length ? (
          work.history.slice(0, 20).map((entry, index) => (
            <div key={entry.jobId + ":" + index}>
              <time>{entry.date}</time>
              <span>
                {entry.service}
                <small>
                  {entry.quantity} {entry.unit.toLowerCase()} · Job{" "}
                  {entry.jobId.slice(-8)}
                </small>
              </span>
              <strong>{money(entry.workPaise)}</strong>
            </div>
          ))
        ) : (
          <p>No completed work in this period.</p>
        )}
      </div>
    </aside>
  );
}

export function MachineryEquipment() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [analytics, setAnalytics] =
    useState<Awaited<ReturnType<typeof catalogClient.analytics>>>();
  const [periodAnalytics, setPeriodAnalytics] =
    useState<Awaited<ReturnType<typeof catalogClient.analytics>>>();
  const [monthlyAnalytics, setMonthlyAnalytics] =
    useState<Awaited<ReturnType<typeof catalogClient.analytics>>>();
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [archived, setArchived] = useState(false);
  const [editor, setEditor] = useState<Equipment | "new">();
  const [period, setPeriod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  useEffect(() => {
    void authClient
      .me()
      .then((session) => {
        if (session?.business.timezone) setTimeZone(session.business.timezone);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    void (async () => {
      const result: Equipment[] = [];
      for (let page = 1; ; page++) {
        const batch = await catalogClient.equipment({
          active: "all",
          page,
          pageSize: 100,
        });
        result.push(...batch.items);
        if (page * 100 >= batch.total) break;
      }
      const stats = await catalogClient.analytics();
      if (live) {
        setItems(result);
        setAnalytics(stats);
        setSelected((value) =>
          result.some((entry) => entry.id === value)
            ? value
            : (result.find((entry) => entry.active && entry.kind === "TRACTOR")
                ?.id ??
              result.find((entry) => entry.active)?.id ??
              result[0]?.id ??
              ""),
        );
        setLoading(false);
      }
    })().catch(() => {
      if (live) {
        setLoading(false);
        setError(true);
      }
    });
    return () => {
      live = false;
    };
  }, [revision]);
  const [start, end] = bounds(period, timeZone, from, to);
  const [monthStart, monthEnd] = bounds("month", timeZone, "", "");
  useEffect(() => {
    let live = true;
    void catalogClient
      .analytics(monthStart, monthEnd)
      .then((data) => {
        if (live) setMonthlyAnalytics(data);
      })
      .catch(() => {
        if (live) setMonthlyAnalytics(undefined);
      });
    return () => {
      live = false;
    };
  }, [monthStart, monthEnd, revision]);
  useEffect(() => {
    if (period === "all") {
      setPeriodAnalytics(undefined);
      return;
    }
    let live = true;
    void catalogClient
      .analytics(start, end)
      .then((data) => {
        if (live) setPeriodAnalytics(data);
      })
      .catch(() => {
        if (live) setPeriodAnalytics(undefined);
      });
    return () => {
      live = false;
    };
  }, [period, start, end, revision]);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (archived ? !item.active : item.active) &&
          (category === "all" || item.kind === category) &&
          (status === "all" || statusLabel(item).toLowerCase() === status) &&
          [
            item.name,
            item.brand,
            item.model,
            item.kind,
            labelFor(item.kind),
            item.id,
            item.serialOrRegistration,
            item.serialNumber,
          ].some((value) =>
            value?.toLowerCase().includes(search.toLowerCase()),
          ),
      ),
    [items, archived, category, status, search],
  );
  const chosen = items.find((item) => item.id === selected);
  const stats = periodAnalytics ?? analytics;
  const work = chosen
    ? (stats?.byId[chosen.id] ?? emptyWork(chosen.id))
    : undefined;
  const activeItems = items.filter(
    (item) =>
      item.active &&
      item.status !== "INACTIVE" &&
      item.status !== "MAINTENANCE",
  );
  const activeCount = activeItems.length;
  const utilizationValues = activeItems.map(
    (item) => monthlyAnalytics?.byId[item.id]?.utilizationPct,
  );
  const averageUtilization =
    utilizationValues.length > 0 &&
    utilizationValues.every((value) => value !== undefined)
      ? utilizationValues.reduce((sum, value) => sum + (value ?? 0), 0) /
        utilizationValues.length
      : undefined;
  async function archive(item: Equipment) {
    if (
      !window.confirm((item.active ? "Archive " : "Restore ") + item.name + "?")
    )
      return;
    try {
      const { id, ...input } = item;
      await catalogClient.saveEquipment(
        {
          ...input,
          active: !item.active,
          status: item.active ? "INACTIVE" : "ACTIVE",
        },
        id,
      );
      setRevision((value) => value + 1);
    } catch {
      setError(true);
    }
  }
  return (
    <section className="machinery-page">
      <div className="machinery-hero">
        <div>
          <h1>Machinery &amp; Tools</h1>
          <p>
            Manage your tractors and tools, track their work, and monitor
            business performance.
          </p>
        </div>
        <div className="machinery-fields" aria-hidden="true">
          <Tractor size={62} />
        </div>
      </div>
      <div className="machinery-kpis">
        <div>
          <span>
            <Tractor />
          </span>
          <p>
            Total Equipment<strong>{items.length}</strong>
            <small>Registered assets</small>
          </p>
        </div>
        <div>
          <span>
            <Wrench />
          </span>
          <p>
            Active Equipment<strong>{activeCount}</strong>
            <small>Ready or available</small>
          </p>
        </div>
        <div>
          <span>
            <Activity />
          </span>
          <p>
            Average Utilization
            <strong className="machine-kpi-text">
              {averageUtilization === undefined
                ? "Not enough data"
                : num(averageUtilization) + "%"}
            </strong>
            <small>This month · active equipment</small>
          </p>
        </div>
        <div>
          <span>
            <ClipboardList />
          </span>
          <p>
            Total Completed Jobs
            <strong>{analytics?.totalCompletedJobs ?? 0}</strong>
            <small>Unique business jobs</small>
          </p>
        </div>
      </div>
      <div className="machinery-toolbar">
        <div className="machinery-tabs">
          <button type="button" className="active">
            Equipment
          </button>
          <a href="/machinery?tab=services">Services</a>
        </div>
        <label className="machine-search">
          <Search size={18} />
          <input
            placeholder="Search equipment by name or model..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Category filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All Equipment</option>
          {categories
            .filter((entry) => items.some((item) => item.kind === entry.kind))
            .map((entry) => (
              <option key={entry.kind} value={entry.kind}>
                {entry.label}
              </option>
            ))}
        </select>
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All Statuses</option>
          {[
            "active",
            "available",
            "under maintenance",
            "inactive",
            "archived",
          ].map((value) => (
            <option key={value} value={value}>
              {value[0].toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="machine-add"
          onClick={() => setEditor("new")}
        >
          <Plus size={18} /> Add Equipment
        </button>
        <label className="machine-archived">
          <input
            type="checkbox"
            checked={archived}
            onChange={(event) => setArchived(event.target.checked)}
          />{" "}
          Archived
        </label>
      </div>
      {loading && <p>Loading equipment…</p>}
      {error && (
        <p role="alert">
          Equipment could not be loaded.{" "}
          <button onClick={() => setRevision((value) => value + 1)}>
            Retry
          </button>
        </p>
      )}
      {!loading && !error && (
        <div className="machinery-body">
          <div className="machinery-list">
            <h2>
              {visible.length} Equipment{" "}
              {chosen && <small>({chosen.name} selected)</small>}
            </h2>
            {visible.length ? (
              <div className="machine-cards">
                {visible.map((item) => {
                  const row = analytics?.byId[item.id] ?? emptyWork(item.id);
                  return (
                    <article
                      key={item.id}
                      className={
                        "machine-card" +
                        (selected === item.id ? " selected" : "")
                      }
                      onClick={() => setSelected(item.id)}
                    >
                      <button
                        type="button"
                        className="machine-image-button"
                        onClick={() => setSelected(item.id)}
                      >
                        <img
                          src={item.photoDataUrl || imageFor(item.kind)}
                          alt={
                            item.photoDataUrl
                              ? item.name
                              : "Representative " + labelFor(item.kind)
                          }
                        />
                      </button>
                      {selected === item.id && (
                        <CircleCheck
                          className="machine-selected-icon"
                          size={24}
                        />
                      )}
                      <div className="machine-card-body">
                        <h3>{item.name}</h3>
                        <p>
                          {item.brand && item.model
                            ? item.brand + " · " + item.model + " · "
                            : ""}
                          {labelFor(item.kind)}
                        </p>
                        <small>
                          {item.photoDataUrl
                            ? "Owner photo"
                            : "Representative image"}
                        </small>
                        <span className="machine-pill">
                          {statusLabel(item)}
                        </span>
                        <div className="machine-card-metrics">
                          <div>
                            <small>Completed Jobs</small>
                            <strong>{row.completedJobs}</strong>
                          </div>
                          <div>
                            <small title="Work value associated with this equipment. Tractor and implement values overlap and must not be summed.">
                              Associated Work Value ⓘ
                            </small>
                            <strong>{money(row.associatedWorkPaise)}</strong>
                          </div>
                        </div>
                        <div className="machine-card-actions">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelected(item.id);
                            }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditor(item);
                            }}
                          >
                            Edit
                          </button>
                          <details
                            className="machine-card-menu"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <summary
                              aria-label={"More actions for " + item.name}
                            >
                              <Ellipsis size={18} />
                            </summary>
                            <div>
                              <button
                                type="button"
                                onClick={() => void archive(item)}
                              >
                                {item.active ? "Archive" : "Restore"}
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="machine-empty">
                No equipment in this view.{" "}
                {items.length === 0 && (
                  <button onClick={() => setEditor("new")}>
                    Register your first machine
                  </button>
                )}
              </div>
            )}
          </div>
          {chosen && work && (
            <EquipmentDetails
              item={chosen}
              work={work}
              allWork={analytics?.byId[chosen.id] ?? emptyWork(chosen.id)}
              all={items}
              period={period}
              setPeriod={setPeriod}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              select={setSelected}
              timeZone={timeZone}
              edit={() => setEditor(chosen)}
              toggleArchive={() => void archive(chosen)}
              periodFrom={start}
              periodTo={end}
              saveAvailability={async (hours) => {
                if (!start || !end) return;
                const { id, ...input } = chosen;
                const records = (chosen.availabilityRecords ?? []).filter(
                  (entry) => entry.from !== start || entry.to !== end,
                );
                await catalogClient.saveEquipment(
                  {
                    ...input,
                    availabilityRecords: [
                      ...records,
                      { from: start, to: end, hours },
                    ],
                  },
                  id,
                );
                setRevision((value) => value + 1);
              }}
            />
          )}
        </div>
      )}
      {editor && (
        <EquipmentWizard
          item={editor === "new" ? undefined : editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}
