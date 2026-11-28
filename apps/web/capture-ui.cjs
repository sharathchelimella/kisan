const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

async function main() {
  const outputDir = path.resolve(__dirname, "../../test-results/redesign-screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop 1600 x 900 (matching user's exact specification!)
  const desktopContext = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });

  const desktopPage = await desktopContext.newPage();

  // Take Dashboard Screenshot at 1600x900
  console.log("Navigating to Dashboard at 1600x900...");
  await desktopPage.goto("http://localhost:5173/dashboard", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const dashboardPath = path.join(outputDir, "01-reference-match-dashboard-1600x900.png");
  await desktopPage.screenshot({ path: dashboardPath, fullPage: false });
  console.log("Saved 1600x900 dashboard screenshot to:", dashboardPath);

  // Take Reports & Analytics Screenshot at 1600x900 matching Image 1
  console.log("Navigating to Reports & Analytics (/reports)...");
  await desktopPage.goto("http://localhost:5173/reports", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const reportsPath = path.join(outputDir, "02-reports-analytics-1600x900.png");
  await desktopPage.screenshot({ path: reportsPath, fullPage: false });
  console.log("Saved reports & analytics screenshot to:", reportsPath);

  // Take Activity History Page Screenshot
  console.log("Navigating to Activity History (/activities)...");
  await desktopPage.goto("http://localhost:5173/activities", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const activitiesPath = path.join(outputDir, "02-activity-history-1600x900.png");
  await desktopPage.screenshot({ path: activitiesPath, fullPage: false });
  console.log("Saved activity history screenshot to:", activitiesPath);

  // Take Machinery Details Screenshot
  console.log("Navigating to Machinery Detail (/machinery/DEMO-tractor)...");
  await desktopPage.goto("http://localhost:5173/machinery/DEMO-tractor", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const machineryPath = path.join(outputDir, "03-machinery-detail-1600x900.png");
  await desktopPage.screenshot({ path: machineryPath, fullPage: false });
  console.log("Saved machinery detail screenshot to:", machineryPath);

  // Take Farmers Management Screenshot at 1600x900 matching Image 1
  console.log("Navigating to Farmers Management (/farmers)...");
  await desktopPage.goto("http://localhost:5173/farmers", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const farmersPath = path.join(outputDir, "05-farmers-management-1600x900.png");
  await desktopPage.screenshot({ path: farmersPath, fullPage: false });
  console.log("Saved farmers management screenshot to:", farmersPath);

  // Click on the first row's action menu to show the 6-item dropdown
  const actionBtn = await desktopPage.$("tbody tr:first-child button[aria-label*='Actions']");
  if (actionBtn) {
    await actionBtn.click();
    await desktopPage.waitForTimeout(500);
    const actionMenuPath = path.join(outputDir, "06-farmers-action-menu-1600x900.png");
    await desktopPage.screenshot({ path: actionMenuPath, fullPage: false });
    console.log("Saved farmers action menu screenshot to:", actionMenuPath);
  }

  // Take Farmer Details Page Screenshot
  console.log("Navigating to Farmer Details (/farmers/FARM-001)...");
  await desktopPage.goto("http://localhost:5173/farmers/FARM-001", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const farmerDetailPath = path.join(outputDir, "07-farmer-details-1600x900.png");
  await desktopPage.screenshot({ path: farmerDetailPath, fullPage: false });
  console.log("Saved farmer details screenshot to:", farmerDetailPath);

  // Take Add Work - Step 3 (Work Details) Screenshot matching add work.jpeg exactly
  console.log("Navigating to Add Work Step 3 (/jobs/new?step=2)...");
  await desktopPage.goto("http://localhost:5173/jobs/new?step=2", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const addWorkStep3Path = path.join(outputDir, "09-add-work-step3-details-1600x900.png");
  await desktopPage.screenshot({ path: addWorkStep3Path, fullPage: false });
  console.log("Saved Add Work Step 3 screenshot to:", addWorkStep3Path);

  // Take Add Work - Step 1 (Farmer Selection) Screenshot
  console.log("Navigating to Add Work Step 1 (/jobs/new?step=0)...");
  await desktopPage.goto("http://localhost:5173/jobs/new?step=0", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const addWorkStep1Path = path.join(outputDir, "10-add-work-step1-farmer-1600x900.png");
  await desktopPage.screenshot({ path: addWorkStep1Path, fullPage: false });
  console.log("Saved Add Work Step 1 screenshot to:", addWorkStep1Path);

  // Take Add Work - Step 2 (Machinery Selection) Screenshot
  console.log("Navigating to Add Work Step 2 (/jobs/new?step=1)...");
  await desktopPage.goto("http://localhost:5173/jobs/new?step=1", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const addWorkStep2Path = path.join(outputDir, "11-add-work-step2-machinery-1600x900.png");
  await desktopPage.screenshot({ path: addWorkStep2Path, fullPage: false });
  console.log("Saved Add Work Step 2 screenshot to:", addWorkStep2Path);

  // Take Add Work - Step 4 (Review & Confirm) Screenshot
  console.log("Navigating to Add Work Step 4 (/jobs/new?step=3)...");
  await desktopPage.goto("http://localhost:5173/jobs/new?step=3", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const addWorkStep4Path = path.join(outputDir, "12-add-work-step4-review-1600x900.png");
  await desktopPage.screenshot({ path: addWorkStep4Path, fullPage: false });
  console.log("Saved Add Work Step 4 screenshot to:", addWorkStep4Path);

  // Take Payments Management Screenshot at 1600x900 matching payments.jpeg exactly
  console.log("Navigating to Payments Management (/payments)...");
  await desktopPage.goto("http://localhost:5173/payments", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1200);
  const paymentsPath = path.join(outputDir, "14-payments-management-1600x900.png");
  await desktopPage.screenshot({ path: paymentsPath, fullPage: false });
  console.log("Saved Payments Management screenshot to:", paymentsPath);

  // Take Outstanding Balances Page Screenshot
  console.log("Navigating to Outstanding Balances (/payments/outstanding-balances)...");
  await desktopPage.goto("http://localhost:5173/payments/outstanding-balances", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const outstandingPath = path.join(outputDir, "15-payments-outstanding-balances-1600x900.png");
  await desktopPage.screenshot({ path: outstandingPath, fullPage: false });
  console.log("Saved Outstanding Balances screenshot to:", outstandingPath);

  // Take Payment Details / Receipt Page Screenshot
  console.log("Navigating to Payment Receipt Detail (/payments/REC-2025-018)...");
  await desktopPage.goto("http://localhost:5173/payments/REC-2025-018", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  const paymentDetailPath = path.join(outputDir, "16-payment-detail-1600x900.png");
  await desktopPage.screenshot({ path: paymentDetailPath, fullPage: false });
  console.log("Saved Payment Detail screenshot to:", paymentDetailPath);

  // Take Bills & Invoices Page Screenshot at 1600x900 matching bills.jpeg
  console.log("Navigating to Bills & Invoices (/invoices)...");
  await desktopPage.goto("http://localhost:5173/invoices", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1200);
  const billsPath = path.join(outputDir, "18-bills-invoices-1600x900.png");
  await desktopPage.screenshot({ path: billsPath, fullPage: false });
  console.log("Saved Bills & Invoices screenshot to:", billsPath);

  // Take Create Bill Modal Screenshot
  const createBillBtn = await desktopPage.$("button:has-text('Create Bill')");
  if (createBillBtn) {
    await createBillBtn.click();
    await desktopPage.waitForTimeout(600);
    const modalPath = path.join(outputDir, "19-create-bill-modal-1600x900.png");
    await desktopPage.screenshot({ path: modalPath, fullPage: false });
    console.log("Saved Create Bill modal screenshot to:", modalPath);
  }

  // 2. Mobile 390 x 844 (iPhone 14 / modern smartphone)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const mobilePage = await mobileContext.newPage();
  console.log("Navigating to Farmers on Mobile (390px)...");
  await mobilePage.goto("http://localhost:5173/farmers", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  const mobileFarmersPath = path.join(outputDir, "08-farmers-mobile-390px.png");
  await mobilePage.screenshot({ path: mobileFarmersPath, fullPage: true });
  console.log("Saved mobile farmers screenshot to:", mobileFarmersPath);

  // Take Add Work on Mobile (390px)
  console.log("Navigating to Add Work on Mobile (390px)...");
  await mobilePage.goto("http://localhost:5173/jobs/new?step=2", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  const mobileAddWorkPath = path.join(outputDir, "13-add-work-mobile-390px.png");
  await mobilePage.screenshot({ path: mobileAddWorkPath, fullPage: true });
  console.log("Saved mobile Add Work screenshot to:", mobileAddWorkPath);

  // Take Payments on Mobile (390px)
  console.log("Navigating to Payments on Mobile (390px)...");
  await mobilePage.goto("http://localhost:5173/payments", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1200);
  const mobilePaymentsPath = path.join(outputDir, "17-payments-mobile-390px.png");
  await mobilePage.screenshot({ path: mobilePaymentsPath, fullPage: true });
  console.log("Saved mobile Payments screenshot to:", mobilePaymentsPath);

  // Take Bills & Invoices on Mobile (390px)
  console.log("Navigating to Bills & Invoices on Mobile (390px)...");
  await mobilePage.goto("http://localhost:5173/invoices", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1200);
  const mobileBillsPath = path.join(outputDir, "20-bills-invoices-mobile-390px.png");
  await mobilePage.screenshot({ path: mobileBillsPath, fullPage: true });
  console.log("Saved mobile Bills & Invoices screenshot to:", mobileBillsPath);

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
