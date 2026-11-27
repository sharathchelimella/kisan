import { connectDatabase, disconnectDatabase } from "./config/database";
import { readEnv } from "./config/env";
import { User } from "./models/User.model";
import { Business } from "./models/Business.model";
import { FarmerModel } from "./models/Farmer.model";
import { EquipmentModel } from "./models/Equipment.model";
import { ServiceModel } from "./models/Service.model";
import { JobModel } from "./models/Job.model";
import { InvoiceModel } from "./models/Invoice.model";
import { ReceiptModel } from "./models/Receipt.model";
import { hashPassword } from "./services/auth.crypto";

const VILLAGES = [
  "Mancherial",
  "Naspur",
  "Luxettipet",
  "Dandepally",
  "Jannaram",
  "Hajipur",
  "Bellampalli",
];

const TELUGU_FIRST_NAMES = [
  "Ramesh", "Suresh", "Venkat", "Mallaiah", "Rajesh", "Kishan", "Laxman", "Ravi",
  "Srinivas", "Satyanarayana", "Anjaiah", "Balaraju", "Bikshapathi", "Chandraiah",
  "Devender", "Gangadhar", "Gopal", "Hanumanthu", "Jagan", "Kanakayya", "Komuraiah",
  "Lingam", "Mahender", "Narasimha", "Pochaiah", "Prabhakar", "Raghupathi", "Ramulu",
  "Sailu", "Shankar", "Thirupathi", "Upender", "Venkatesh", "Yadaiah", "Mallesh",
  "Naresh", "Santosh", "Ashok", "Kiran", "Prasad", "Sudhakar", "Vijay", "Anand",
];

const TELUGU_LAST_NAMES = [
  "Reddy", "Rao", "Goud", "Patel", "Yadav", "Kurma", "Bhoopathi", "Komati",
  "Padmashali", "Nayaka", "Vemula", "Marri", "Gande", "Kandula", "Durgam", "Polasa",
  "Chintala", "Gaddam", "Bommireddy", "Kallepu", "Thota", "Singam", "Pothula",
];

function generatePhone(seed: number): string {
  const num = (9800000000 + (seed * 179424673) % 199999999).toString();
  return num.slice(0, 10);
}

export async function seedDemoData() {
  const env = readEnv(process.env);
  if (!env.MONGODB_URI) {
    console.error("MONGODB_URI is required to run database seeding.");
    process.exit(1);
  }

  await connectDatabase(env.MONGODB_URI);
  console.log("Connected to MongoDB for seeding.");

  // 1. Ensure Demo Owner User & Business
  let user = await User.findOne({ email: "owner@kisan.local" });
  let business = await Business.findOne({ name: "Ramesh Machinery Services" });

  if (!user || !business) {
    const passwordHash = await hashPassword("KisanOwner#2026");
    if (!business) {
      business = await Business.create({
        name: "Ramesh Machinery Services",
        ownerUserId: new User()._id,
        village: "Mancherial",
        phone: "9848012345",
        address: "Survey No. 42, Bypass Road, Mancherial, Telangana",
        timezone: "Asia/Kolkata",
        invoicePrefix: "KMM",
        nextInvoiceSequence: 125,
        notificationsOptIn: true,
      });
    }

    if (!user) {
      user = await User.create({
        displayName: "Ramesh Reddy",
        mobile: "9848012345",
        email: "owner@kisan.local",
        passwordHash,
        role: "OWNER",
        preferredLanguage: "en",
        businessId: business._id,
      });
      business.ownerUserId = user._id;
      await business.save();
    }
  }

  const businessId = business._id;
  const userId = user._id;

  // 2. Clean up previous demo records for this business
  console.log("Cleaning up prior demo data for business:", businessId.toString());
  await Promise.all([
    FarmerModel.deleteMany({ businessId, notes: /DEMO_DATA/ }),
    EquipmentModel.deleteMany({ businessId, serialOrRegistration: /DEMO/ }),
    ServiceModel.deleteMany({ businessId, name: /\[DEMO\]/ }),
    JobModel.deleteMany({ businessId, notes: /DEMO_DATA/ }),
    InvoiceModel.deleteMany({ businessId, invoiceNumber: /^KMM-DEMO-/ }),
    ReceiptModel.deleteMany({ businessId, note: /DEMO_DATA/ }),
  ]);

  // 3. Create 10 Machinery Assets
  console.log("Seeding 10 machinery assets across 5 categories...");
  const equipmentSpecs = [
    { name: "Mahindra 575 DI (45 HP)", kind: "TRACTOR", icon: "tractor", reg: "DEMO-TS-19-TR-1001" },
    { name: "John Deere 5050 D (50 HP)", kind: "TRACTOR", icon: "tractor", reg: "DEMO-TS-19-TR-1002" },
    { name: "Shaktiman Regular 7ft Rotavator", kind: "ROTAVATOR", icon: "disc", reg: "DEMO-TS-19-RO-2001" },
    { name: "Fieldking Heavy Duty Rotavator", kind: "ROTAVATOR", icon: "disc", reg: "DEMO-TS-19-RO-2002" },
    { name: "2-Wheel Hydraulic Tipping Trailer", kind: "TRAILER", icon: "truck", reg: "DEMO-TS-19-TL-3001" },
    { name: "4-Wheel Mud & Sand Trailer", kind: "TRAILER", icon: "truck", reg: "DEMO-TS-19-TL-3002" },
    { name: "9-Tyne Rigid Cultivator", kind: "CULTIVATOR", icon: "grid", reg: "DEMO-TS-19-CU-4001" },
    { name: "11-Tyne Spring Loaded Cultivator", kind: "CULTIVATOR", icon: "grid", reg: "DEMO-TS-19-CU-4002" },
    { name: "Hydraulic Reversible MB Plough", kind: "PLOUGH", icon: "wrench", reg: "DEMO-TS-19-PL-5001" },
    { name: "Multi-Crop High Output Thresher", kind: "HARVESTER", icon: "cog", reg: "DEMO-TS-19-HA-6001" },
  ];

  const createdEquipment = await EquipmentModel.insertMany(
    equipmentSpecs.map((e) => ({
      businessId,
      name: e.name,
      kind: e.kind,
      displayIcon: e.icon,
      serialOrRegistration: e.reg,
      active: true,
    })),
  );

  const eqMap = new Map(createdEquipment.map((e) => [e.kind, e._id]));
  const tractorId = createdEquipment[0]._id;
  const rotavatorId = createdEquipment[2]._id;
  const trailerId = createdEquipment[4]._id;
  const cultivatorId = createdEquipment[6]._id;
  const ploughId = createdEquipment[8]._id;
  const thresherId = createdEquipment[9]._id;

  // 4. Create 5 Services
  console.log("Seeding 5 standard services...");
  const serviceSpecs = [
    { name: "[DEMO] Tractor / Ploughing", unit: "ACRE" as const, rate: 160000, eq: [tractorId, ploughId] },
    { name: "[DEMO] Rotavator Till & Level", unit: "ACRE" as const, rate: 145000, eq: [tractorId, rotavatorId] },
    { name: "[DEMO] Trailer / Mud Transport", unit: "TRIP" as const, rate: 120000, eq: [tractorId, trailerId] },
    { name: "[DEMO] Cultivator Weeding", unit: "ACRE" as const, rate: 110000, eq: [tractorId, cultivatorId] },
    { name: "[DEMO] Multi-crop Threshing", unit: "HOUR" as const, rate: 180000, eq: [thresherId] },
  ];

  const createdServices = await ServiceModel.insertMany(
    serviceSpecs.map((s) => ({
      businessId,
      name: s.name,
      unit: s.unit,
      defaultRatePaise: s.rate,
      equipmentIds: s.eq,
      active: true,
      rateHistory: [],
    })),
  );

  // 5. Create 100 Farmers
  console.log("Seeding 100 registered farmers with realistic Telangana village profiles...");
  const farmerDocs = [];
  for (let i = 0; i < 100; i++) {
    const fn = TELUGU_FIRST_NAMES[i % TELUGU_FIRST_NAMES.length];
    const ln = TELUGU_LAST_NAMES[(i * 3) % TELUGU_LAST_NAMES.length];
    const fullName = `${fn} ${ln}`;
    const village = VILLAGES[i % VILLAGES.length];
    const mobile = generatePhone(i + 1);

    farmerDocs.push({
      businessId,
      name: fullName,
      normalizedName: fullName.trim().toLowerCase(),
      village,
      normalizedVillage: village.trim().toLowerCase(),
      mobile,
      normalizedMobile: mobile,
      notes: `DEMO_DATA farmer #${i + 1}`,
    });
  }

  const createdFarmers = await FarmerModel.insertMany(farmerDocs);
  console.log(`Created ${createdFarmers.length} farmers.`);

  // 6. Generate 6 Months of Work Records, Invoices, and Payments
  // Month 6 (Current Demo Reporting Month target):
  // Total Revenue: 4,85,000 (48,500,000 paise)
  // Collected: 3,72,000 (37,200,000 paise)
  // Outstanding: 1,13,000 (11,300,000 paise)
  // Completed works: 124
  // Active farmers: 87
  // Breakdown by Machinery:
  // - Plough: 1,92,000 (42 works)
  // - Rotavator: 1,16,000 (28 works)
  // - Trailer (Mud): 88,000 (24 works)
  // - Cultivator: 56,000 (18 works)
  // - Others: 33,000 (12 works)
  // Total works = 42 + 28 + 24 + 18 + 12 = 124 works!
  // Total revenue = 192000 + 116000 + 88000 + 56000 + 33000 = 4,85,000!

  console.log("Generating reconciled work records, invoices, and payments...");
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  // Helper to format date YYYY-MM-DD
  function toDateStr(y: number, m: number, d: number) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Generate Month 6 (Current reporting period)
  const month6WorksConfig = [
    { serviceIdx: 0, count: 42, targetPaise: 19200000, name: "Ploughing" },
    { serviceIdx: 1, count: 28, targetPaise: 11600000, name: "Rotavator" },
    { serviceIdx: 2, count: 24, targetPaise: 8800000, name: "Mud Transport" },
    { serviceIdx: 3, count: 18, targetPaise: 5600000, name: "Cultivator" },
    { serviceIdx: 4, count: 12, targetPaise: 3300000, name: "Others" },
  ];

  let seq = 1;
  const activeFarmersSet = new Set<string>();

  for (const group of month6WorksConfig) {
    const srv = createdServices[group.serviceIdx];
    const baseAmount = Math.floor(group.targetPaise / group.count);
    let remainingPaise = group.targetPaise;

    for (let c = 0; c < group.count; c++) {
      const isLast = c === group.count - 1;
      const amountPaise = isLast ? remainingPaise : baseAmount;
      remainingPaise -= amountPaise;

      // Pick from the first 87 farmers to guarantee exactly 87 active farmers
      const farmerIdx = (seq * 7) % 87;
      const farmer = createdFarmers[farmerIdx];
      activeFarmersSet.add(farmer._id.toString());

      const day = ((c * 3) % 27) + 1;
      const workDate = toDateStr(year, month, day);

      const job = await JobModel.create({
        businessId,
        farmerId: farmer._id,
        workDate,
        village: farmer.village,
        fieldLocation: `Plot #${(c % 15) + 1}, North Field`,
        notes: `DEMO_DATA ${group.name} service`,
        state: "BILLED",
        lines: [
          {
            lineId: `line-${seq}`,
            serviceId: srv._id,
            serviceNameSnapshot: srv.name,
            equipmentIds: srv.equipmentIds,
            unit: srv.unit,
            quantity: "1.0",
            pricingMode: "DEFAULT_RATE",
            defaultRateSnapshotPaise: amountPaise,
            totalPaise: amountPaise,
          },
        ],
        totalPaise: amountPaise,
        completedAt: new Date(`${workDate}T12:00:00Z`),
        createdBy: userId,
      });

      const invNum = `KMM-DEMO-${String(seq).padStart(4, "0")}`;
      const invoice = await InvoiceModel.create({
        businessId,
        jobId: job._id,
        farmerId: farmer._id,
        invoiceNumber: invNum,
        sequence: seq,
        lifecycle: "ISSUED",
        issuedAt: new Date(`${workDate}T14:00:00Z`),
        workDate,
        farmerSnapshot: { name: farmer.name, mobile: farmer.mobile, village: farmer.village },
        ownerSnapshot: { name: "Ramesh Reddy", phone: "9848012345", address: "Mancherial" },
        lines: [
          {
            lineId: `line-${seq}`,
            serviceId: srv._id,
            equipmentIds: srv.equipmentIds,
            serviceName: srv.name,
            unit: srv.unit,
            quantity: "1.0",
            ratePaise: amountPaise,
            amountPaise,
          },
        ],
        totalPaise: amountPaise,
        paidPaise: 0,
        duePaise: amountPaise,
        status: "UNPAID",
      });

      job.invoiceId = invoice._id;
      await job.save();

      seq++;
    }
  }

  console.log(`Active farmers generated in current reporting month: ${activeFarmersSet.size}`);

  // Reconcile payments for Month 6 to reach exactly ₹3,72,000 collected & ₹1,13,000 pending!
  // Target: 37,200,000 paise collected out of 48,500,000 paise total.
  const invoices = await InvoiceModel.find({ businessId, invoiceNumber: /^KMM-DEMO-/ }).sort({ issuedAt: 1 });
  let neededCollection = 37200000;

  for (let i = 0; i < invoices.length && neededCollection > 0; i++) {
    const inv = invoices[i];
    const payAmount = Math.min(neededCollection, inv.totalPaise);
    neededCollection -= payAmount;

    inv.paidPaise = payAmount;
    inv.duePaise = inv.totalPaise - payAmount;
    inv.status = inv.duePaise === 0 ? "PAID" : payAmount > 0 ? "PARTIAL" : "UNPAID";
    await inv.save();

    if (payAmount > 0) {
      // payment date: 3 to 6 days after invoice date
      const invDay = parseInt(inv.workDate.split("-")[2], 10);
      const payDay = Math.min(28, invDay + ((i % 4) + 3));
      const payDate = toDateStr(year, month, payDay);

      await ReceiptModel.create({
        businessId,
        invoiceId: inv._id,
        farmerId: inv.farmerId,
        amountPaise: payAmount,
        method: i % 3 === 0 ? "UPI" : i % 3 === 1 ? "CASH" : "BANK",
        paymentDate: payDate,
        note: "DEMO_DATA settled via app",
        reference: `REC-DEMO-${String(i + 1).padStart(4, "0")}`,
        status: "POSTED",
        idempotencyKey: `idemp-demo-${i + 1}`,
        requestFingerprint: `fp-demo-${i + 1}`,
        createdBy: userId,
      });
    }
  }

  // 7. Generate Prior 5 Months of Historical Data for Trend (Months 1-5)
  // Month 1: Rev 2,10,000 | Col 1,45,000 (~55 jobs)
  // Month 2: Rev 2,75,000 | Col 1,95,000 (~70 jobs)
  // Month 3: Rev 3,25,000 | Col 2,45,000 (~85 jobs)
  // Month 4: Rev 4,05,000 | Col 3,00,000 (~100 jobs)
  // Month 5: Rev 4,35,000 | Col 3,40,000 (~110 jobs)
  const priorMonths = [
    { offset: 5, revPaise: 21000000, colPaise: 14500000, jobs: 55 },
    { offset: 4, revPaise: 27500000, colPaise: 19500000, jobs: 70 },
    { offset: 3, revPaise: 32500000, colPaise: 24500000, jobs: 85 },
    { offset: 2, revPaise: 40500000, colPaise: 30000000, jobs: 100 },
    { offset: 1, revPaise: 43500000, colPaise: 34000000, jobs: 110 },
  ];

  console.log("Generating 5 prior months of historical trend records (>350 jobs)...");
  for (const pm of priorMonths) {
    const pDate = new Date(year, month - 1 - pm.offset, 1);
    const pYear = pDate.getFullYear();
    const pMonth = pDate.getMonth() + 1;

    const basePerJob = Math.floor(pm.revPaise / pm.jobs);
    let remRev = pm.revPaise;
    let remCol = pm.colPaise;

    for (let j = 0; j < pm.jobs; j++) {
      const isLast = j === pm.jobs - 1;
      const jobAmount = isLast ? remRev : basePerJob;
      remRev -= jobAmount;

      const farmer = createdFarmers[(j + pm.offset * 13) % 100];
      const srv = createdServices[j % createdServices.length];
      const day = (j % 27) + 1;
      const wDate = toDateStr(pYear, pMonth, day);

      const job = await JobModel.create({
        businessId,
        farmerId: farmer._id,
        workDate: wDate,
        village: farmer.village,
        fieldLocation: `Sector ${j % 5 + 1}`,
        notes: "DEMO_DATA historical job",
        state: "BILLED",
        lines: [
          {
            lineId: `line-p-${pm.offset}-${j}`,
            serviceId: srv._id,
            serviceNameSnapshot: srv.name,
            equipmentIds: srv.equipmentIds,
            unit: srv.unit,
            quantity: "1.0",
            pricingMode: "DEFAULT_RATE",
            defaultRateSnapshotPaise: jobAmount,
            totalPaise: jobAmount,
          },
        ],
        totalPaise: jobAmount,
        completedAt: new Date(`${wDate}T10:00:00Z`),
        createdBy: userId,
      });

      const invNum = `KMM-HIST-${pm.offset}-${String(j + 1).padStart(4, "0")}`;
      const payAmount = isLast ? remCol : Math.min(remCol, Math.floor(pm.colPaise / pm.jobs));
      remCol = Math.max(0, remCol - payAmount);

      const invoice = await InvoiceModel.create({
        businessId,
        jobId: job._id,
        farmerId: farmer._id,
        invoiceNumber: invNum,
        sequence: seq++,
        lifecycle: "ISSUED",
        issuedAt: new Date(`${wDate}T12:00:00Z`),
        workDate: wDate,
        farmerSnapshot: { name: farmer.name, mobile: farmer.mobile, village: farmer.village },
        ownerSnapshot: { name: "Ramesh Reddy", phone: "9848012345", address: "Mancherial" },
        lines: [
          {
            lineId: `line-p-${pm.offset}-${j}`,
            serviceId: srv._id,
            equipmentIds: srv.equipmentIds,
            serviceName: srv.name,
            unit: srv.unit,
            quantity: "1.0",
            ratePaise: jobAmount,
            amountPaise: jobAmount,
          },
        ],
        totalPaise: jobAmount,
        paidPaise: payAmount,
        duePaise: jobAmount - payAmount,
        status: payAmount === jobAmount ? "PAID" : payAmount > 0 ? "PARTIAL" : "UNPAID",
      });

      job.invoiceId = invoice._id;
      await job.save();

      if (payAmount > 0) {
        await ReceiptModel.create({
          businessId,
          invoiceId: invoice._id,
          farmerId: farmer._id,
          amountPaise: payAmount,
          method: j % 2 === 0 ? "UPI" : "CASH",
          paymentDate: wDate,
          note: "DEMO_DATA historical payment",
          reference: `REC-HIST-${pm.offset}-${j + 1}`,
          status: "POSTED",
          idempotencyKey: `idemp-hist-${pm.offset}-${j + 1}`,
          requestFingerprint: `fp-hist-${pm.offset}-${j + 1}`,
          createdBy: userId,
        });
      }
    }
  }

  const totalJobsCount = await JobModel.countDocuments({ businessId, notes: /DEMO_DATA/ });
  console.log(`Successfully completed demo seeding! Total historical & current demo jobs created: ${totalJobsCount}`);

  await disconnectDatabase();
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
