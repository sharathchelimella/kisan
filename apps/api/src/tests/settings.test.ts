import { expect, it } from "vitest";
import { createSettingsService } from "../services/settings.service";
import { memorySettings } from "./memory-settings";

const initial = {
  businessName: "Kisan Machinery",
  village: "Madhapur",
  phone: "",
  address: "",
  timezone: "Asia/Kolkata",
  invoicePrefix: "KMM",
  nextInvoiceSequence: 12,
  ownerDisplayName: "Owner",
  ownerMobile: "",
  preferredLanguage: "en" as const,
  notificationsOptIn: false,
  textSize: "STANDARD" as const,
};
it("updates only the owner's tenant and protects invoice numbering", async () => {
  const service = createSettingsService(
    memorySettings([
      { businessId: "business-a", ownerId: "owner-a", settings: initial },
    ]),
  );
  expect(await service.get("business-b", "owner-a")).toBeNull();
  expect(
    await service.update("business-a", "owner-b", { businessName: "Forged" }),
  ).toBeNull();
  const saved = await service.update("business-a", "owner-a", {
    businessName: "New Name",
    preferredLanguage: "te",
    textSize: "LARGE",
    notificationsOptIn: true,
  });
  expect(saved).toMatchObject({
    businessName: "New Name",
    preferredLanguage: "te",
    textSize: "LARGE",
    notificationsOptIn: true,
    invoicePrefix: "KMM",
    nextInvoiceSequence: 12,
  });
  await expect(
    service.update("business-a", "owner-a", { invoicePrefix: "X" }),
  ).rejects.toThrow();
  await expect(
    service.update("business-a", "owner-a", { phone: "invalid letters" }),
  ).rejects.toThrow();
});
