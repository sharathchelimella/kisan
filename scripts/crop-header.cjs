const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

async function crop() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const rawPath = path.resolve(
    "C:/Users/Sravan Reddy/.gemini/antigravity/brain/df4991ed-d0ca-48bd-9f36-511bf0aba68a/.user_uploaded/media_1795809403621_c113dea0.jpg"
  );
  const base64Src = fs.readFileSync(rawPath).toString("base64");

  await page.setContent(`
    <body style="margin:0; background:white;">
      <img id="src" src="data:image/jpeg;base64,${base64Src}" style="display:none;" />
      <canvas id="c"></canvas>
    </body>
  `);

  const result = await page.evaluate(async () => {
    const img = document.getElementById("src");
    await new Promise((r) => {
      if (img.complete) r();
      else img.onload = r;
    });
    const c = document.getElementById("c");
    const ctx = c.getContext("2d");

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // Header banner tractor in field:
    // Notice in payments.jpeg: the header is at the top right of the white panel
    // Top right area between right edge of search bar and user profile
    // In payments.jpeg:
    // w is ~1024, h is ~576 (or similar)
    // Let's locate the tractor in field
    // In payments.jpeg, the main content area has the green circular rupee "Payments" title on left,
    // and to its right, a realistic tractor in green field fading to white.
    // The tractor is located roughly at x: 53% to 77%, y: 1.5% to 9%
    // In payments.jpeg (1024 x 576):
    // Top row contains Payments on left, tractor panorama in center-right, and English/Avatar on far right
    // The tractor panorama is at:
    // x: 510 to 750
    // y: 0 to 48
    const cropX = Math.round(w * 0.50);
    const cropY = Math.round(h * 0.005);
    const cropW = Math.round(w * 0.25);
    const cropH = Math.round(h * 0.08);

    c.width = cropW;
    c.height = cropH;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return { w, h, cropX, cropY, cropW, cropH, dataUrl: c.toDataURL("image/jpeg", 0.98) };
  });

  const base64Data = result.dataUrl.replace(/^data:image\/jpeg;base64,/, "");
  fs.mkdirSync(path.resolve("apps/web/src/assets"), { recursive: true });
  fs.writeFileSync(path.resolve("apps/web/src/assets/payment-header-tractor.jpg"), base64Data, "base64");
  console.log("Cropped successfully:", result);
  await browser.close();
}

crop().catch(console.error);
