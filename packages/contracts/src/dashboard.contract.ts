import { z } from "zod";
import { businessDateSchema, moneyPaiseSchema } from "./common";

export const periodSchema = z
  .object({ from: businessDateSchema, to: businessDateSchema })
  .refine(({ from, to }) => from <= to, { path: ["to"] });

export const dashboardQuerySchema = periodSchema.safeExtend({
  asOf: businessDateSchema,
});

export const recentActivityItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  date: businessDateSchema,
  label: z.string(),
  amountPaise: moneyPaiseSchema.optional().default(0),
  farmerName: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  timestamp: z.string().optional(),
});

export const dashboardSchema = dashboardQuerySchema.safeExtend({
  workValuePaise: moneyPaiseSchema,
  collectionsPaise: moneyPaiseSchema,
  outstandingPaise: moneyPaiseSchema,
  farmerCount: z.number().int().nonnegative(),
  completedJobCount: z.number().int().nonnegative(),
  todayWorkPaise: moneyPaiseSchema,
  todayCollectionsPaise: moneyPaiseSchema,
  recentActivity: z.array(recentActivityItemSchema).max(20),

  // Extended SaaS Analytics (Optional for contract backwards-compatibility)
  revenueGrowthPct: z.number().optional(),
  collectedPct: z.number().optional(),
  pendingPct: z.number().optional(),
  worksGrowthPct: z.number().optional(),
  farmersGrowthPct: z.number().optional(),
  activeFarmerCount: z.number().int().nonnegative().optional(),
  machineryUtilizationPct: z.number().optional(),
  collectedGrowthPct: z.number().optional(),
  pendingGrowthPct: z.number().optional(),
  machineryGrowthPct: z.number().optional(),

  monthlyTrend: z
    .array(
      z.object({
        month: z.string(),
        revenuePaise: moneyPaiseSchema,
        collectedPaise: moneyPaiseSchema,
      }),
    )
    .optional(),

  monthlyTrend12: z
    .array(
      z.object({
        month: z.string(),
        revenuePaise: moneyPaiseSchema,
        collectedPaise: moneyPaiseSchema,
      }),
    )
    .optional(),

  machineryStats: z
    .array(
      z.object({
        name: z.string(),
        kind: z.string(),
        utilizationPct: z.number(),
        worksCount: z.number().int().nonnegative(),
        image: z.string().optional(),
      }),
    )
    .optional(),

  pendingPaymentsTopFarmers: z
    .array(
      z.object({
        farmerName: z.string(),
        works: z.string(),
        totalPaise: moneyPaiseSchema,
        paidPaise: moneyPaiseSchema,
        pendingPaise: moneyPaiseSchema,
        farmerId: z.string().optional(),
      }),
    )
    .optional(),

  revenueByMachinery: z
    .array(
      z.object({
        name: z.string(),
        revenuePaise: moneyPaiseSchema,
        pct: z.number(),
        color: z.string().optional(),
      }),
    )
    .optional(),

  equipmentUtilization: z
    .array(
      z.object({
        name: z.string(),
        utilizationPct: z.number(),
        icon: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional(),

  paymentBreakdown: z
    .object({
      collectedPaise: moneyPaiseSchema,
      pendingPaise: moneyPaiseSchema,
      collectedPct: z.number(),
      avgPaymentDays: z.number(),
    })
    .optional(),

  worksByType: z
    .array(
      z.object({
        name: z.string(),
        count: z.number().int().nonnegative(),
        color: z.string().optional(),
      }),
    )
    .optional(),

  todayOverview: z
    .object({
      todayWorkPaise: moneyPaiseSchema,
      todayCollectionsPaise: moneyPaiseSchema,
      scheduledJobs: z.number().int().nonnegative(),
      pendingJobs: z.number().int().nonnegative(),
    })
    .optional(),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type RecentActivityItem = z.infer<typeof recentActivityItemSchema>;
