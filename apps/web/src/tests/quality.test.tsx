import { createInstance } from "i18next";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { expect, it } from "vitest";
import { resources } from "../i18n/resources";
import {
  ConfirmDialog,
  FilterBar,
  InlineMessage,
  MoneyText,
  SearchInput,
  Skeleton,
} from "../views/components/common";

it("renders named controls, currency and nonvisual loading text", async () => {
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources });
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <MoneyText amountPaise={595000} />
      <FilterBar label="Filters" clearLabel="Clear" onClear={() => {}}>
        <SearchInput
          label="Search farmers"
          value="Ramesh"
          onChange={() => {}}
        />
      </FilterBar>
      <Skeleton label="Loading records" />
      <InlineMessage kind="error">Could not save</InlineMessage>
      <ConfirmDialog
        open={false}
        title="Confirm"
        description="Review action"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </I18nextProvider>,
  );
  expect(html).toContain("₹5,950.00");
  expect(html).toContain('type="search"');
  expect(html).toContain('value="Ramesh"');
  expect(html).toContain('aria-label="Loading records"');
  expect(html).toContain('role="alert"');
  expect(html).toContain("aria-labelledby=");
});

it("keeps design token text contrast above WCAG AA for normal text", () => {
  const luminance = (hex: string) => {
    const values = hex
      .match(/[0-9a-f]{2}/gi)!
      .map((part) => parseInt(part, 16) / 255);
    const [r, g, b] = values.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (foreground: string, background: string) => {
    const [light, dark] = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    return (light + 0.05) / (dark + 0.05);
  };
  expect(ratio("#1F3025", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  expect(ratio("#58685e", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  expect(ratio("#FFFFFF", "#16803D")).toBeGreaterThanOrEqual(4.5);
  expect(ratio("#B42332", "#fff1f1")).toBeGreaterThanOrEqual(4.5);
});
