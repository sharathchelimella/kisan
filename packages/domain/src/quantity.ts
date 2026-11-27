import {
  moneyPaiseSchema,
  quantitySchema,
  type PricingUnit,
} from "@kisan/contracts";
import { toSafePaise } from "./money";

export function multiplyRate(
  quantity: string,
  ratePaise: number,
  unit: PricingUnit,
): number {
  const [whole, fraction = ""] = quantitySchema.parse(quantity).split(".");
  if (unit === "TRIP" && fraction.length)
    throw new RangeError("Trips require a whole number");

  const denominator = 10n ** BigInt(fraction.length);
  const numerator =
    BigInt(whole + fraction) * BigInt(moneyPaiseSchema.parse(ratePaise));
  // Round once at line level. For nonnegative values, ties round up.
  return toSafePaise((2n * numerator + denominator) / (2n * denominator));
}
