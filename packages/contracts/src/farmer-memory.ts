import type { Farmer, FarmerInput } from "./farmer.contract";
import type {
  FarmerMatches,
  FarmerPatch,
  FarmerQuery,
} from "./farmer-directory";
import { normalizeFarmerPhone, normalizeFarmerText } from "./farmer-directory";

// Independent, explicitly seeded test/demo adapter. Never selected by the production API.
export function createMemoryFarmerRepository(
  seed: { businessId: string; farmer: Farmer }[] = [],
) {
  const records = new Map(
    seed.map(({ businessId, farmer }) => [
      farmer.id,
      { businessId, farmer: structuredClone(farmer) },
    ]),
  );
  function get(businessId: string, id: string) {
    const record = records.get(id);
    return record?.businessId === businessId ? record.farmer : null;
  }
  return {
    async list(businessId: string, query: FarmerQuery) {
      const q = normalizeFarmerText(query.q ?? "");
      const phone = normalizeFarmerPhone(query.q);
      const all = [...records.values()]
        .filter((record) => record.businessId === businessId)
        .map((record) => record.farmer)
        .filter(
          (farmer) =>
            Boolean(farmer.archivedAt) === (query.archived === "true"),
        )
        .filter(
          (farmer) =>
            !query.village ||
            normalizeFarmerText(farmer.village) ===
              normalizeFarmerText(query.village),
        )
        .filter(
          (farmer) =>
            !q ||
            [farmer.name, farmer.village].some((value) =>
              normalizeFarmerText(value).includes(q),
            ) ||
            Boolean(
              phone &&
              /^\d+$/.test(phone) &&
              normalizeFarmerPhone(farmer.mobile).includes(phone),
            ),
        )
        .sort((a, b) => {
          if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
            return a.createdAt.localeCompare(b.createdAt);
          }
          return (
            normalizeFarmerText(a.name).localeCompare(
              normalizeFarmerText(b.name),
            ) || a.id.localeCompare(b.id)
          );
        });

      const activeFarmers = [...records.values()]
        .filter((record) => record.businessId === businessId && !record.farmer.archivedAt)
        .map((r) => r.farmer);
      const totalWorkCount = activeFarmers.reduce((sum, f) => sum + (f.totalWorks ?? 0), 0);
      const totalAmountPaise = activeFarmers.reduce((sum, f) => sum + (f.totalAmountPaise ?? 0), 0);
      const pendingAmountPaise = activeFarmers.reduce((sum, f) => sum + (f.pendingAmountPaise ?? 0), 0);
      const villages = Array.from(new Set(activeFarmers.map((f) => f.village).filter(Boolean))).sort();

      return structuredClone({
        items: all.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        ),
        total: all.length,
        page: query.page,
        pageSize: query.pageSize,
        summary: {
          totalFarmers: activeFarmers.length,
          totalWorkCount,
          totalAmountPaise,
          pendingAmountPaise,
          villages,
        },
      });
    },
    async summary(businessId: string) {
      const activeFarmers = [...records.values()]
        .filter((record) => record.businessId === businessId && !record.farmer.archivedAt)
        .map((r) => r.farmer);
      return structuredClone({
        totalFarmers: activeFarmers.length,
        totalWorkCount: activeFarmers.reduce((sum, f) => sum + (f.totalWorks ?? 0), 0),
        totalAmountPaise: activeFarmers.reduce((sum, f) => sum + (f.totalAmountPaise ?? 0), 0),
        pendingAmountPaise: activeFarmers.reduce((sum, f) => sum + (f.pendingAmountPaise ?? 0), 0),
        villages: Array.from(new Set(activeFarmers.map((f) => f.village).filter(Boolean))).sort(),
      });
    },
    async delete(businessId: string, id: string) {
      const record = records.get(id);
      if (record && record.businessId === businessId) {
        records.delete(id);
        return { success: true };
      }
      return { success: false };
    },
    async get(businessId: string, id: string) {
      return structuredClone(get(businessId, id));
    },
    async create(businessId: string, input: FarmerInput) {
      const now = new Date().toISOString();
      const farmer = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      records.set(farmer.id, { businessId, farmer });
      return structuredClone(farmer);
    },
    async update(businessId: string, id: string, input: FarmerPatch) {
      const farmer = get(businessId, id);
      if (!farmer || farmer.archivedAt) return null;
      Object.assign(farmer, input, { updatedAt: new Date().toISOString() });
      return structuredClone(farmer);
    },
    async archive(businessId: string, id: string) {
      const farmer = get(businessId, id);
      if (farmer && !farmer.archivedAt) {
        farmer.archivedAt = new Date().toISOString();
        farmer.updatedAt = farmer.archivedAt;
      }
      return structuredClone(farmer);
    },
    async matches(businessId: string, input: FarmerMatches) {
      const phone = normalizeFarmerPhone(input.mobile);
      return structuredClone(
        [...records.values()]
          .filter((record) => record.businessId === businessId)
          .map((record) => record.farmer)
          .filter(
            (farmer) =>
              farmer.id !== input.excludeId &&
              ((normalizeFarmerText(farmer.name) ===
                normalizeFarmerText(input.name) &&
                normalizeFarmerText(farmer.village) ===
                  normalizeFarmerText(input.village)) ||
                Boolean(
                  phone && normalizeFarmerPhone(farmer.mobile) === phone,
                )),
          )
          .slice(0, 10),
      );
    },
  };
}
