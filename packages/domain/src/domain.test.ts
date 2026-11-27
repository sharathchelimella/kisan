import { expect, it } from "vitest";
import { deriveStatus, multiplyRate, parseRupees, sumPaise } from "./index";

it("parses and sums integer paise without losing precision", () => {
  expect(sumPaise([parseRupees("0.1"), parseRupees("0.20")])).toBe(30);
  expect(() => parseRupees("0.001")).toThrow();
  expect(() => sumPaise([Number.MAX_SAFE_INTEGER, 1])).toThrow();
});

it("rounds once and enforces integral trips", () => {
  expect(multiplyRate("3.5", 170_000, "ACRE")).toBe(595_000);
  expect(multiplyRate("0.29", 50, "HOUR")).toBe(15);
  expect(multiplyRate("2", 50_000, "TRIP")).toBe(100_000);
  expect(() => multiplyRate("2.5", 50_000, "TRIP")).toThrow();
  expect(() => multiplyRate("0", 50_000, "ACRE")).toThrow();
});

it("derives unpaid, partial, paid, and void statuses", () => {
  expect(deriveStatus(750_000, 0, "ISSUED")).toBe("UNPAID");
  expect(deriveStatus(750_000, 300_000, "ISSUED")).toBe("PARTIAL");
  expect(deriveStatus(750_000, 750_000, "ISSUED")).toBe("PAID");
  expect(deriveStatus(750_000, 0, "VOID")).toBe("VOID");
  expect(deriveStatus(0, 0, "ISSUED")).toBe("UNPAID");
  expect(() => deriveStatus(750_000, 750_001, "ISSUED")).toThrow();
});
