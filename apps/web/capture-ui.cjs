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

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
