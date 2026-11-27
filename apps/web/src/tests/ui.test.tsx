import { createInstance } from "i18next";
import { Plus } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { expect, it } from "vitest";
import { resources } from "../i18n/resources";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Loading,
  StatusBadge,
} from "../views/components/ui";

it("renders accessible shared primitives and textual invoice states", async () => {
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources });
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <Card>
        <Field
          id="village"
          label="Village"
          hint="Optional"
          error="Check spelling"
        />
        <Button busy>Save</Button>
        <Loading />
        <StatusBadge status="UNPAID" />
        <StatusBadge status="PARTIAL" />
        <StatusBadge status="PAID" />
        <StatusBadge status="VOID" />
        <EmptyState icon={Plus} description="No work records" />
      </Card>
    </I18nextProvider>,
  );
  expect(html).toContain('for="village"');
  expect(html).toContain('aria-describedby="village-hint village-error"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('disabled=""');
  expect(html).toContain('role="status"');
  for (const label of [
    "Unpaid",
    "Partially paid",
    "Paid",
    "Void",
    "No work records",
  ]) {
    expect(html).toContain(`>${label}<`);
  }
});
