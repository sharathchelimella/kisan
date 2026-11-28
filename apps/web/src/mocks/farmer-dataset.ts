import type { Farmer } from "@kisan/contracts";

// Top 10 sample farmer records matching Image 1 exactly
const top10Farmers: Farmer[] = [
  {
    id: "FARM-001",
    name: "Ramesh Reddy",
    village: "Lingampalli",
    mobile: "98765 43210",
    totalWorks: 8,
    totalAmountPaise: 8600000,
    paidAmountPaise: 6000000,
    pendingAmountPaise: 2600000,
    status: "ACTIVE",
    notes: "Main paddy farm, 12 acres. Prefers early morning work.",
    createdAt: "2025-01-01T00:00:01Z",
    updatedAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "FARM-002",
    name: "Srinivas Rao",
    village: "Kothapalli",
    mobile: "98490 11223",
    totalWorks: 5,
    totalAmountPaise: 5200000,
    paidAmountPaise: 5200000,
    pendingAmountPaise: 0,
    status: "ACTIVE",
    notes: "Prompt UPI payer, regular rotavator customer.",
    createdAt: "2025-01-01T00:00:02Z",
    updatedAt: "2025-01-18T14:30:00Z",
  },
  {
    id: "FARM-003",
    name: "Karthik Naidu",
    village: "Venkatapalli",
    mobile: "97012 33445",
    totalWorks: 12,
    totalAmountPaise: 13800000,
    paidAmountPaise: 10000000,
    pendingAmountPaise: 3800000,
    status: "ACTIVE",
    notes: "Commercial cotton grower. Multiple land preparation cycles.",
    createdAt: "2025-01-01T00:00:03Z",
    updatedAt: "2025-01-22T09:15:00Z",
  },
  {
    id: "FARM-004",
    name: "Mahesh Yadav",
    village: "Chintalapalli",
    mobile: "90123 44556",
    totalWorks: 4,
    totalAmountPaise: 3600000,
    paidAmountPaise: 2000000,
    pendingAmountPaise: 1600000,
    status: "ACTIVE",
    notes: "Dairy farm and fodder fields. Mud transport jobs.",
    createdAt: "2025-01-01T00:00:04Z",
    updatedAt: "2025-01-15T11:20:00Z",
  },
  {
    id: "FARM-005",
    name: "Bala Krishna",
    village: "Rangampet",
    mobile: "93987 66554",
    totalWorks: 7,
    totalAmountPaise: 7700000,
    paidAmountPaise: 7700000,
    pendingAmountPaise: 0,
    status: "ACTIVE",
    notes: "Sugar cane cultivator. Cleared full balance on 14 Jan.",
    createdAt: "2025-01-01T00:00:05Z",
    updatedAt: "2025-01-14T16:00:00Z",
  },
  {
    id: "FARM-006",
    name: "Venkatesh",
    village: "Peddapalli",
    mobile: "99012 77889",
    totalWorks: 6,
    totalAmountPaise: 6400000,
    paidAmountPaise: 4000000,
    pendingAmountPaise: 2400000,
    status: "ACTIVE",
    notes: "Chilli farm near canal. Requires tractor ploughing.",
    createdAt: "2025-01-01T00:00:06Z",
    updatedAt: "2025-01-21T18:00:00Z",
  },
  {
    id: "FARM-007",
    name: "Prasad Goud",
    village: "Mallampet",
    mobile: "99887 55660",
    totalWorks: 3,
    totalAmountPaise: 2800000,
    paidAmountPaise: 2800000,
    pendingAmountPaise: 0,
    status: "ACTIVE",
    notes: "Organic vegetable farm. Always pays cash upon completion.",
    createdAt: "2025-01-01T00:00:07Z",
    updatedAt: "2025-01-10T12:00:00Z",
  },
  {
    id: "FARM-008",
    name: "Anil Kumar",
    village: "Lingampalli",
    mobile: "97033 22110",
    totalWorks: 9,
    totalAmountPaise: 9600000,
    paidAmountPaise: 5000000,
    pendingAmountPaise: 4600000,
    status: "ACTIVE",
    notes: "Corn and soybean farmer. Partial payment pending bank clearance.",
    createdAt: "2025-01-01T00:00:08Z",
    updatedAt: "2025-01-23T17:45:00Z",
  },
  {
    id: "FARM-009",
    name: "Dileep Reddy",
    village: "Kothapalli",
    mobile: "93476 88990",
    totalWorks: 5,
    totalAmountPaise: 5500000,
    paidAmountPaise: 5500000,
    pendingAmountPaise: 0,
    status: "ACTIVE",
    notes: "Paddy crop, 8 acres. Zero pending dues.",
    createdAt: "2025-01-01T00:00:09Z",
    updatedAt: "2025-01-19T13:10:00Z",
  },
  {
    id: "FARM-010",
    name: "Nagaraju",
    village: "Chintalapalli",
    mobile: "96521 33440",
    totalWorks: 4,
    totalAmountPaise: 4000000,
    paidAmountPaise: 2000000,
    pendingAmountPaise: 2000000,
    status: "ACTIVE",
    notes: "Groundnut crop. Remaining balance due end of harvest.",
    createdAt: "2025-01-01T00:00:10Z",
    updatedAt: "2025-01-16T15:20:00Z",
  },
];

const TELUGU_FIRST_NAMES = [
  "Ravi", "Satish", "Mallesh", "Suresh", "Prabhakar", "Anand", "Vijay", "Laxman",
  "Devender", "Gangadhar", "Gopal", "Hanumanthu", "Jagan", "Komuraiah", "Lingam",
  "Mahender", "Narasimha", "Pochaiah", "Ramulu", "Sailu", "Shankar", "Thirupathi",
  "Upender", "Yadaiah", "Naresh", "Santosh", "Ashok", "Kiran", "Sudhakar", "Rajesh",
  "Mallaiah", "Kishan", "Anjaiah", "Balaraju", "Bikshapathi", "Chandraiah", "Srinath",
  "Venkat", "Madhusudhan", "Raghavendra",
];

const TELUGU_LAST_NAMES = [
  "Reddy", "Rao", "Goud", "Patel", "Yadav", "Kurma", "Bhoopathi", "Komati",
  "Nayaka", "Vemula", "Marri", "Gande", "Kandula", "Durgam", "Polasa",
  "Chintala", "Gaddam", "Bommireddy", "Kallepu", "Thota", "Singam", "Pothula",
];

const VILLAGES = [
  "Lingampalli",
  "Kothapalli",
  "Venkatapalli",
  "Chintalapalli",
  "Rangampet",
  "Peddapalli",
  "Mallampet",
  "Ramakrishnapuram",
  "Mancherial",
  "Hajipur",
  "Luxettipet",
  "Jannaram",
  "Dandepally",
  "Naspur",
];

// Generate 114 additional fictional farmers
function generateRemainingFarmers(): Farmer[] {
  const count = 114;
  let remWorks = 323;
  let remTotalPaise = 57600000;
  let remPendingPaise = 6650000;

  const result: Farmer[] = [];

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const farmerIndex = 11 + i;
    const id = `FARM-${String(farmerIndex).padStart(3, "0")}`;

    const firstName = TELUGU_FIRST_NAMES[i % TELUGU_FIRST_NAMES.length];
    const lastName = TELUGU_LAST_NAMES[(i * 3 + 2) % TELUGU_LAST_NAMES.length];
    const name = i === 0 ? "Raju Yadav" : `${firstName} ${lastName}`;
    const village = i === 0 ? "Ramakrishnapuram" : VILLAGES[(i * 2 + 1) % VILLAGES.length];

    // Phone number format: 98XXX XXXXX
    const p1 = 98000 + ((i * 137 + 42) % 1999);
    const p2 = 10000 + ((i * 389 + 17) % 89999);
    const mobile = i === 0 ? "98765 43210" : `${p1} ${p2}`;

    // Work count
    const w = isLast
      ? remWorks
      : Math.max(1, Math.min(6, Math.floor(remWorks / (count - i))));
    remWorks -= w;

    // Total paise in multiples of 50000 (₹500)
    const tot = isLast
      ? remTotalPaise
      : Math.round(remTotalPaise / (count - i) / 50000) * 50000;
    remTotalPaise -= tot;

    // Pending paise
    let pend = 0;
    if (remPendingPaise > 0) {
      if (isLast) {
        pend = Math.min(tot, remPendingPaise);
      } else if (i % 8 === 0 && remPendingPaise >= 500000) {
        pend = Math.min(
          tot,
          Math.min(1000000, Math.round(remPendingPaise / 4 / 50000) * 50000),
        );
      }
      remPendingPaise -= pend;
    }
    const paid = tot - pend;

    result.push({
      id,
      name,
      village,
      mobile,
      totalWorks: w,
      totalAmountPaise: tot,
      paidAmountPaise: paid,
      pendingAmountPaise: pend,
      status: "ACTIVE",
      notes: `Registered farmer in ${village}.`,
      createdAt: `2025-01-02T${String(Math.floor(i / 10)).padStart(2, "0")}:${String((i % 10) * 6).padStart(2, "0")}:00Z`,
      updatedAt: `2025-01-20T12:00:00Z`,
    });
  }

  return result;
}

export const all124DemoFarmers: Farmer[] = [
  ...top10Farmers,
  ...generateRemainingFarmers(),
];
