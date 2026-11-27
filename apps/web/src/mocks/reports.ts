import { aggregateReport, reportCsv, type ReportSource } from "@kisan/domain";
import type { ReportClient } from "../models/report";

// Comprehensive demo source reflecting the target metrics:
// 124 works, ₹4,85,000 revenue, ₹3,72,000 collected, ₹1,13,000 pending
const services = [
  { id: "DEMO-srv-plough", name: "Tractor / Ploughing", eq: ["DEMO-tractor", "DEMO-plough"], count: 42, rev: 19200000 },
  { id: "DEMO-srv-rotavator", name: "Rotavator Till & Level", eq: ["DEMO-tractor", "DEMO-rotavator"], count: 28, rev: 11600000 },
  { id: "DEMO-srv-trailer", name: "Trailer / Mud Transport", eq: ["DEMO-tractor", "DEMO-trailer"], count: 24, rev: 8800000 },
  { id: "DEMO-srv-cultivator", name: "Cultivator Weeding", eq: ["DEMO-tractor", "DEMO-cultivator"], count: 18, rev: 5600000 },
  { id: "DEMO-srv-others", name: "Multi-crop Threshing", eq: ["DEMO-thresher"], count: 12, rev: 3300000 },
];

const jobs: any[] = [];
const invoices: any[] = [];
const receipts: any[] = [];

let jId = 1;
for (const s of services) {
  const avg = Math.floor(s.rev / s.count);
  for (let i = 0; i < s.count; i++) {
    const isLast = i === s.count - 1;
    const amount = isLast ? s.rev - avg * (s.count - 1) : avg;
    const day = (i % 28) + 1;
    const dStr = `2026-11-${String(day).padStart(2, "0")}`;
    const jobId = `DEMO-job-${jId}`;
    const invId = `DEMO-inv-${jId}`;

    jobs.push({
      id: jobId,
      farmerId: `DEMO-farmer-${(jId % 87) + 1}`,
      workDate: dStr,
      lines: [
        {
          serviceId: s.id,
          serviceName: s.name,
          amountPaise: amount,
          equipmentIds: s.eq,
        },
      ],
    });

    invoices.push({
      id: invId,
      farmerId: `DEMO-farmer-${(jId % 87) + 1}`,
      issuedDate: dStr,
      lifecycle: "ISSUED",
      totalPaise: amount,
      lines: [
        {
          serviceId: s.id,
          serviceName: s.name,
          amountPaise: amount,
          equipmentIds: s.eq,
        },
      ],
    });

    // 76.7% collected overall
    if (jId <= 95) {
      receipts.push({
        id: `DEMO-rec-${jId}`,
        invoiceId: invId,
        paymentDate: dStr,
        amountPaise: amount,
        method: jId % 3 === 0 ? "UPI" : jId % 3 === 1 ? "CASH" : "BANK",
      });
    }

    jId++;
  }
}

const source: ReportSource = {
  jobs,
  invoices,
  receipts,
  equipmentNames: {
    "DEMO-tractor": "Mahindra 575 DI (45 HP)",
    "DEMO-rotavator": "Shaktiman 7ft Rotavator",
    "DEMO-trailer": "Tipping Trailer",
    "DEMO-cultivator": "9-Tyne Cultivator",
    "DEMO-plough": "MB Plough",
    "DEMO-thresher": "Multi-Crop Thresher",
  },
};

export const demoReportOptions = {
  farmers: [
    { id: "DEMO-farmer-1", name: "Ramesh Reddy (Mancherial)" },
    { id: "DEMO-farmer-2", name: "Suresh Rao (Naspur)" },
    { id: "DEMO-farmer-3", name: "Venkat Goud (Luxettipet)" },
    { id: "DEMO-farmer-4", name: "Mallaiah Yadav (Dandepally)" },
    { id: "DEMO-farmer-5", name: "Rajesh Patel (Jannaram)" },
  ],
  equipment: [
    { id: "DEMO-tractor", name: "Mahindra 575 DI (Tractor)" },
    { id: "DEMO-rotavator", name: "Shaktiman 7ft (Rotavator)" },
    { id: "DEMO-trailer", name: "Tipping Trailer" },
    { id: "DEMO-cultivator", name: "9-Tyne Cultivator" },
    { id: "DEMO-plough", name: "MB Plough" },
    { id: "DEMO-thresher", name: "Multi-Crop Thresher" },
  ],
  services: [
    { id: "DEMO-srv-plough", name: "Tractor / Ploughing" },
    { id: "DEMO-srv-rotavator", name: "Rotavator Till & Level" },
    { id: "DEMO-srv-trailer", name: "Trailer / Mud Transport" },
    { id: "DEMO-srv-cultivator", name: "Cultivator Weeding" },
    { id: "DEMO-srv-others", name: "Multi-crop Threshing" },
  ],
};

export const demoReports: ReportClient = {
  async get(query) {
    return aggregateReport(query, source);
  },
  async exportCsv(query) {
    return new Blob([reportCsv(aggregateReport(query, source))], {
      type: "text/csv;charset=utf-8",
    });
  },
};
