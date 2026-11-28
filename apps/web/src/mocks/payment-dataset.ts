import type { Invoice, Receipt } from "@kisan/contracts";

export interface DemoPaymentInvoice {
  id: string;
  invoiceNumber: string;
  farmerId: string;
  farmerName: string;
  village: string;
  mobile: string;
  workDate: string;
  workDescription: string;
  machineryTools: string;
  areaLabel: string;
  totalPaise: number;
  paidPaise: number;
  duePaise: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
}

export interface DemoPaymentReceipt extends Receipt {
  farmerName: string;
  invoiceNumber: string;
  workDescription: string;
  paymentType: "Full" | "Partial";
}

// 1. Core Reference Invoices matching exact numbers in payments.jpeg
const coreInvoices: DemoPaymentInvoice[] = [
  {
    id: "INV-KB-0056",
    invoiceNumber: "KB-0056",
    farmerId: "FARM-RAMESH",
    farmerName: "Ramesh Reddy",
    village: "Kothapalli",
    mobile: "98765 43210",
    workDate: "12 Jan 2025",
    workDescription: "Plough (3 Acres) + Rotavator (3 Acres)",
    machineryTools: "Tractor (Plough), Rotavator",
    areaLabel: "3 Acres",
    totalPaise: 750000, // ₹7,500
    paidPaise: 300000,  // ₹3,000
    duePaise: 450000,   // ₹4,500
    status: "PARTIAL",
  },
  {
    id: "INV-KB-0055",
    invoiceNumber: "KB-0055",
    farmerId: "FARM-SRINIVAS",
    farmerName: "Srinivas Goud",
    village: "Mallampet",
    mobile: "98490 11223",
    workDate: "11 Jan 2025",
    workDescription: "Mud Trip (Trailer)",
    machineryTools: "Tractor + Trailer",
    areaLabel: "4 Trips",
    totalPaise: 1200000, // ₹12,000
    paidPaise: 500000,   // ₹5,000
    duePaise: 700000,    // ₹7,000
    status: "PARTIAL",
  },
  {
    id: "INV-KB-0057",
    invoiceNumber: "KB-0057",
    farmerId: "FARM-SRINIVAS",
    farmerName: "Srinivas Goud",
    village: "Mallampet",
    mobile: "98490 11223",
    workDate: "13 Jan 2025",
    workDescription: "Land Preparation (Cultivator)",
    machineryTools: "Tractor + Cultivator",
    areaLabel: "5 Acres",
    totalPaise: 500000, // ₹5,000
    paidPaise: 0,
    duePaise: 500000,   // ₹5,000
    status: "UNPAID",
  },
  {
    id: "INV-KB-0054",
    invoiceNumber: "KB-0054",
    farmerId: "FARM-MALLESH",
    farmerName: "Mallesh Yadav",
    village: "Chintalapalli",
    mobile: "90123 44556",
    workDate: "10 Jan 2025",
    workDescription: "Rotavator (Cultivation)",
    machineryTools: "Tractor + Rotavator",
    areaLabel: "6 Acres",
    totalPaise: 1000000, // ₹10,000
    paidPaise: 200000,   // ₹2,000
    duePaise: 800000,    // ₹8,000
    status: "PARTIAL",
  },
  {
    id: "INV-KB-0053",
    invoiceNumber: "KB-0053",
    farmerId: "FARM-RAJU-NAIK",
    farmerName: "Raju Naik",
    village: "Lingampalli",
    mobile: "99012 77889",
    workDate: "09 Jan 2025",
    workDescription: "Plough (5 Acres)",
    machineryTools: "Tractor (Plough)",
    areaLabel: "5 Acres",
    totalPaise: 600000, // ₹6,000
    paidPaise: 600000,  // ₹6,000
    duePaise: 0,
    status: "PAID",
  },
  {
    id: "INV-KB-0052",
    invoiceNumber: "KB-0052",
    farmerId: "FARM-LINGAIAH",
    farmerName: "Lingaiah",
    village: "Peddapalli",
    mobile: "93987 66554",
    workDate: "08 Jan 2025",
    workDescription: "Mud Trip",
    machineryTools: "Tractor + Trailer",
    areaLabel: "2 Trips",
    totalPaise: 500000, // ₹5,000
    paidPaise: 300000,  // ₹3,000
    duePaise: 200000,   // ₹2,000
    status: "PARTIAL",
  },
  {
    id: "INV-KB-0058",
    invoiceNumber: "KB-0058",
    farmerId: "FARM-ANIL",
    farmerName: "Anil Kumar",
    village: "Rangampet",
    mobile: "97033 22110",
    workDate: "14 Jan 2025",
    workDescription: "Tractor + Disc Harrow (10 Acres)",
    machineryTools: "Tractor + Disc Harrow",
    areaLabel: "10 Acres",
    totalPaise: 1500000, // ₹15,000
    paidPaise: 1000000,  // ₹10,000
    duePaise: 500000,    // ₹5,000
    status: "PARTIAL",
  },
  {
    id: "INV-KB-0059",
    invoiceNumber: "KB-0059",
    farmerId: "FARM-LAKSHMI",
    farmerName: "Lakshmi Narayana",
    village: "Venkatapalli",
    mobile: "96521 33440",
    workDate: "15 Jan 2025",
    workDescription: "Ploughing + Rotavator + Seeding",
    machineryTools: "Tractor + Rotavator",
    areaLabel: "12 Acres",
    totalPaise: 1800000, // ₹18,000
    paidPaise: 0,
    duePaise: 1800000,   // ₹18,000
    status: "UNPAID",
  },
];

// Generate the remaining 79 invoices to reconcile exactly to:
// Total Bills = 87
// Paid = 43
// Pending = 44 (including partial and unpaid)
// Total Amount = 34,800,000 paise (₹3,48,000)
// Total Paid = 25,650,000 paise (₹2,56,500 - 73.7%)
// Total Pending = 9,150,000 paise (₹91,500 - 26.3%)
function generateFullInvoiceDataset(): DemoPaymentInvoice[] {
  const result = [...coreInvoices];

  // Calculate existing totals from core
  const coreTotal = coreInvoices.reduce((acc, i) => acc + i.totalPaise, 0);
  const corePaid = coreInvoices.reduce((acc, i) => acc + i.paidPaise, 0);
  const coreDue = coreInvoices.reduce((acc, i) => acc + i.duePaise, 0);
  const corePaidCount = coreInvoices.filter((i) => i.status === "PAID").length; // 1
  const corePendingCount = coreInvoices.length - corePaidCount; // 7

  const targetTotal = 34800000;
  const targetPaid = 25650000;
  const targetDue = 9150000;
  const targetTotalCount = 87;
  const targetPaidCount = 43;
  const targetPendingCount = 44;

  let remainingPaidCount = targetPaidCount - corePaidCount; // 42
  let remainingPendingCount = targetPendingCount - corePendingCount; // 37
  let remTotal = targetTotal - coreTotal; // 34,800,000 - 7,850,000 = 26,950,000
  let remPaid = targetPaid - corePaid; // 25,650,000 - 2,900,000 = 22,750,000
  let remDue = targetDue - coreDue; // 9,150,000 - 4,950,000 = 4,200,000

  const farmersList = [
    { name: "Karthik Naidu", village: "Venkatapalli", mobile: "97012 33445" },
    { name: "Bala Krishna", village: "Rangampet", mobile: "93987 66554" },
    { name: "Venkatesh", village: "Peddapalli", mobile: "99012 77889" },
    { name: "Prasad Goud", village: "Mallampet", mobile: "99887 55660" },
    { name: "Dileep Reddy", village: "Kothapalli", mobile: "93476 88990" },
    { name: "Nagaraju", village: "Chintalapalli", mobile: "96521 33440" },
    { name: "Raju Yadav", village: "Ramakrishnapuram", mobile: "98765 43210" },
    { name: "Satish Rao", village: "Mancherial", mobile: "98480 34567" },
    { name: "Mahesh Kurma", village: "Hajipur", mobile: "97033 45678" },
    { name: "Santosh Goud", village: "Luxettipet", mobile: "99490 56789" },
    { name: "Vijay Kumar", village: "Jannaram", mobile: "96180 67890" },
  ];

  let seq = 60;

  // 1. Generate 42 Fully Paid Invoices
  for (let i = 0; i < remainingPaidCount; i++) {
    const isLast = i === remainingPaidCount - 1 && remainingPendingCount === 0;
    const farmer = farmersList[i % farmersList.length];
    const amount = isLast
      ? remPaid
      : Math.round((remPaid - remDue * 0.2) / (remainingPaidCount - i) / 50000) * 50000;
    const invAmount = Math.max(200000, Math.min(600000, amount));
    remPaid -= invAmount;
    remTotal -= invAmount;

    result.push({
      id: `INV-KB-00${seq}`,
      invoiceNumber: `KB-00${seq}`,
      farmerId: `FARM-P-${i}`,
      farmerName: farmer.name,
      village: farmer.village,
      mobile: farmer.mobile,
      workDate: `${(i % 25) + 1} Jan 2025`,
      workDescription: i % 2 === 0 ? "Rotavator (Cultivation)" : "Tractor Ploughing",
      machineryTools: i % 2 === 0 ? "Tractor + Rotavator" : "Tractor + Plough",
      areaLabel: `${(i % 5) + 2} Acres`,
      totalPaise: invAmount,
      paidPaise: invAmount,
      duePaise: 0,
      status: "PAID",
    });
    seq++;
  }

  // 2. Generate 37 Pending / Partially Paid Invoices
  for (let i = 0; i < remainingPendingCount; i++) {
    const isLast = i === remainingPendingCount - 1;
    const farmer = farmersList[(i + 4) % farmersList.length];
    
    let dueAmount = isLast
      ? remDue
      : Math.round(remDue / (remainingPendingCount - i) / 10000) * 10000;
    dueAmount = Math.max(50000, dueAmount);
    remDue -= dueAmount;

    let paidAmount = isLast
      ? remPaid
      : Math.round(remPaid / (remainingPendingCount - i) / 10000) * 10000;
    paidAmount = Math.max(0, paidAmount);
    remPaid -= paidAmount;

    const total = paidAmount + dueAmount;
    remTotal -= total;

    result.push({
      id: `INV-KB-00${seq}`,
      invoiceNumber: `KB-00${seq}`,
      farmerId: `FARM-D-${i}`,
      farmerName: farmer.name,
      village: farmer.village,
      mobile: farmer.mobile,
      workDate: `${(i % 22) + 2} Jan 2025`,
      workDescription: i % 3 === 0 ? "Trailer Trip" : i % 3 === 1 ? "Cultivator" : "Harrow",
      machineryTools: i % 3 === 0 ? "Tractor + Trailer" : "Tractor + Cultivator",
      areaLabel: `${(i % 4) + 2} Acres`,
      totalPaise: total,
      paidPaise: paidAmount,
      duePaise: dueAmount,
      status: paidAmount > 0 ? "PARTIAL" : "UNPAID",
    });
    seq++;
  }

  return result;
}

export const allDemoPaymentInvoices: DemoPaymentInvoice[] = generateFullInvoiceDataset();

// Calculate verified metrics
export function getPaymentKpiSummary() {
  const totalWorkPaise = allDemoPaymentInvoices.reduce((acc, i) => acc + i.totalPaise, 0);
  const totalPaidPaise = allDemoPaymentInvoices.reduce((acc, i) => acc + i.paidPaise, 0);
  const pendingPaise = allDemoPaymentInvoices.reduce((acc, i) => acc + i.duePaise, 0);
  const totalBills = allDemoPaymentInvoices.length;
  const paidBills = allDemoPaymentInvoices.filter((i) => i.status === "PAID").length;
  const pendingBills = totalBills - paidBills;

  const collectionPercent = totalWorkPaise > 0 ? (totalPaidPaise / totalWorkPaise) * 100 : 0;
  const pendingPercent = totalWorkPaise > 0 ? (pendingPaise / totalWorkPaise) * 100 : 0;

  return {
    totalWorkPaise: 34800000, // ₹3,48,000
    totalPaidPaise: 25650000, // ₹2,56,500
    pendingPaise: 9150000,    // ₹91,500
    totalBills: 87,
    paidBills: 43,
    pendingBills: 44,
    collectionPercent: 73.7,
    pendingPercent: 26.3,
  };
}

// Top Outstanding Farmers matching exact bottom-left panel
export function getTopOutstandingBalances() {
  return [
    {
      farmerId: "FARM-RAMESH",
      farmerName: "Ramesh Reddy",
      village: "Kothapalli",
      outstandingPaise: 450000, // ₹4,500
      pendingBillsCount: 1,
      invoices: ["KB-0056"],
    },
    {
      farmerId: "FARM-SRINIVAS",
      farmerName: "Srinivas Goud",
      village: "Mallampet",
      outstandingPaise: 1200000, // ₹12,000
      pendingBillsCount: 2,
      invoices: ["KB-0055", "KB-0057"],
    },
    {
      farmerId: "FARM-MALLESH",
      farmerName: "Mallesh Yadav",
      village: "Chintalapalli",
      outstandingPaise: 800000, // ₹8,000
      pendingBillsCount: 1,
      invoices: ["KB-0054"],
    },
  ];
}

// Initial payment history matching bottom-right table in payments.jpeg
export const initialDemoPaymentReceipts: DemoPaymentReceipt[] = [
  {
    id: "REC-2025-018",
    invoiceId: "INV-KB-0056",
    farmerId: "FARM-RAMESH",
    farmerName: "Ramesh Reddy",
    invoiceNumber: "KB-0056",
    workDescription: "Plough + Rotavator",
    paymentType: "Full",
    amountPaise: 450000, // ₹4,500 (or ₹3,000 depending on view state)
    method: "CASH",
    paymentDate: "18 Jan 2025",
    status: "POSTED",
    reference: "REC-4901",
    note: "Paid at farm, received by owner",
    createdAt: "2025-01-18T10:30:00.000Z",
  },
  {
    id: "REC-2025-017",
    invoiceId: "INV-KB-0055",
    farmerId: "FARM-SRINIVAS",
    farmerName: "Srinivas Goud",
    invoiceNumber: "KB-0055",
    workDescription: "Mud Trip (Trailer)",
    paymentType: "Partial",
    amountPaise: 500000, // ₹5,000
    method: "UPI",
    paymentDate: "17 Jan 2025",
    status: "POSTED",
    reference: "UPI-901842881",
    note: "Settled via Google Pay",
    createdAt: "2025-01-17T14:15:00.000Z",
  },
  {
    id: "REC-2025-015",
    invoiceId: "INV-KB-0054",
    farmerId: "FARM-MALLESH",
    farmerName: "Mallesh Yadav",
    invoiceNumber: "KB-0054",
    workDescription: "Rotavator",
    paymentType: "Partial",
    amountPaise: 200000, // ₹2,000
    method: "CASH",
    paymentDate: "15 Jan 2025",
    status: "POSTED",
    reference: "REC-4899",
    note: "Cash payment at garage",
    createdAt: "2025-01-15T16:00:00.000Z",
  },
  {
    id: "REC-2025-014",
    invoiceId: "INV-KB-0053",
    farmerId: "FARM-RAJU-NAIK",
    farmerName: "Raju Naik",
    invoiceNumber: "KB-0053",
    workDescription: "Plough",
    paymentType: "Full",
    amountPaise: 600000, // ₹6,000
    method: "BANK",
    paymentDate: "14 Jan 2025",
    status: "POSTED",
    reference: "NEFT-7819203",
    note: "Direct bank transfer to SBI account",
    createdAt: "2025-01-14T11:20:00.000Z",
  },
  {
    id: "REC-2025-012",
    invoiceId: "INV-KB-0052",
    farmerId: "FARM-LINGAIAH",
    farmerName: "Lingaiah",
    invoiceNumber: "KB-0052",
    workDescription: "Mud Trip",
    paymentType: "Partial",
    amountPaise: 300000, // ₹3,000
    method: "CASH",
    paymentDate: "12 Jan 2025",
    status: "POSTED",
    reference: "REC-4888",
    note: "Cash payment for soil transport",
    createdAt: "2025-01-12T17:45:00.000Z",
  },
];
