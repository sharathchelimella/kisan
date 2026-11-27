import { demoBusinessId, demoLookups } from "../mocks/lookups";
import { expect, it } from "vitest";
import { resources } from "../i18n/resources";
import { navigation, pages } from "../models/navigation";
import { mockHealth } from "../mocks/health";
import { demoFarmers } from "../mocks/fixtures";
import { farmerSchema } from "@kisan/contracts";

it("has distinct routes and a title and purpose in each language", () => {
  expect(new Set(navigation.map((page) => pages[page].path)).size).toBe(9);
  for (const { translation } of Object.values(resources)) {
    for (const page of navigation) {
      expect(translation.pages[page].title).toBeTruthy();
      expect(translation.pages[page].description).toBeTruthy();
    }
  }
});

it("marks mock responses and fixtures as DEMO", async () => {
  expect((await mockHealth.getHealth()).meta.requestId).toMatch(/^DEMO/);
  for (const farmer of demoFarmers) {
    expect(farmerSchema.parse(farmer).name).toMatch(/^DEMO/);
  }
});

it("scopes demo farmer lookup to the demo business", async () => {
  const [farmer] = demoFarmers;
  await expect(
    demoLookups.findFarmer(demoBusinessId, farmer.id),
  ).resolves.toEqual(farmer);
  await expect(
    demoLookups.findFarmer("DEMO-different-business", farmer.id),
  ).resolves.toBeNull();
});
