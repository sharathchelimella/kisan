import { demoSession } from "../mocks/auth";
import { expect, test } from "@playwright/test";
import { navigation, moreNavigation, pages } from "../models/navigation";
import { resources } from "../i18n/resources";

test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/v1\/(equipment|services)\?/, (route) =>
    route.fulfill({
      json: {
        data: { items: [], total: 0, page: 1, pageSize: 20 },
        meta: { requestId: "DEMO" },
      },
    }),
  );
  await page.route("**/api/v1/farmers?*", (route) =>
    route.fulfill({
      json: {
        data: { items: [], total: 0, page: 1, pageSize: 20 },
        meta: { requestId: "DEMO" },
      },
    }),
  );
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: { data: demoSession, meta: { requestId: "DEMO-navigation" } },
    }),
  );
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 1440, height: 900 },
]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    test("navigates all nine pages", async ({ page }, testInfo) => {
      await page.goto("/");
      await expect(page).toHaveURL("/dashboard");
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      for (const key of navigation) {
        const navTitle = resources.en.translation.pages[key].title;
        const title = key === "dashboard" ? "Business Overview" : navTitle;
        const description =
          key === "dashboard"
            ? "A clear view of your work and collections"
            : resources.en.translation.pages[key].description;
        const mobile = viewport.width === 360;
        if (mobile && moreNavigation.some((entry) => entry === key)) {
          await nav.getByRole("button", { name: "More" }).click();
        }
        await nav
          .getByRole("link", {
            name: mobile && key === "dashboard" ? "Home" : navTitle,
            exact: true,
          })
          .click();
        await expect(page).toHaveURL(pages[key].path);
        await expect(
          page.getByRole("heading", { level: 1, name: title, exact: true }),
        ).toBeVisible();
        await expect(page.getByText(description)).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: testInfo.outputPath(`${key}-${viewport.width}.png`),
        });
      }
    });

    test("wraps translated navigation and preserves the language on reload", async ({
      page,
    }) => {
      await page.goto("/reports");
      for (const language of ["te", "hi"] as const) {
        const copy = resources[language].translation;
        await page.locator(".language select").selectOption(language);
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(
          page.getByRole("heading", { name: copy.pages.reports.title }),
        ).toBeVisible();
        const nav = page.getByRole("navigation", { name: copy.navigation });
        if (viewport.width === 360) {
          await nav.getByRole("button", { name: copy.more }).click();
        }
        for (const link of await nav.getByRole("link").all()) {
          const bounds = await link.boundingBox();
          expect(bounds?.height).toBeGreaterThanOrEqual(48);
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
          expect(
            await link.evaluate(
              (element) => element.scrollWidth <= element.clientWidth,
            ),
          ).toBe(true);
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(viewport.width);
      }
    });
  });
}

test("opens and closes the mobile More menu with the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/dashboard");
  const more = page.getByRole("button", { name: "More" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Machinery & Tools" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect(more).toBeFocused();
});
