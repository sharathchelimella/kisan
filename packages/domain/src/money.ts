import { moneyPaiseSchema } from "@kisan/contracts";

export function toSafePaise(value: bigint): number {
  return moneyPaiseSchema.parse(Number(value));
}

export function parseRupees(input: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match)
    throw new RangeError("Enter an INR amount with up to two decimal places");
  const [, rupees, fractional = ""] = match;
  return toSafePaise(BigInt(rupees) * 100n + BigInt(fractional.padEnd(2, "0")));
}

export function sumPaise(amounts: readonly number[]): number {
  return toSafePaise(
    amounts.reduce(
      (sum, amount) => sum + BigInt(moneyPaiseSchema.parse(amount)),
      0n,
    ),
  );
}
