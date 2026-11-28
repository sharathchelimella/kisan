import type { Equipment, Job } from "./index";

export type EquipmentWork = {
  equipmentId: string;
  completedJobs: number;
  associatedWorkPaise: number;
  operatingHours: number;
  operatingHoursComplete: boolean;
  availableHours?: number;
  utilizationPct?: number;
  serviceAcres: number;
  trips: number;
  trend: {
    month: string;
    jobs: number;
    workPaise: number;
    hours: number;
    acres: number;
    trips: number;
  }[];
  partners: {
    equipmentId: string;
    jobs: number;
    workPaise: number;
    hours: number;
    acres: number;
    trips: number;
  }[];
  history: {
    jobId: string;
    date: string;
    service: string;
    equipmentIds: string[];
    quantity: string;
    unit: string;
    workPaise: number;
  }[];
};

export function calculateEquipmentAnalytics(
  equipment: Equipment[],
  jobs: Job[],
  from?: string,
  to?: string,
) {
  const complete = jobs.filter(
    (job) => job.state === "COMPLETED" || job.state === "BILLED",
  );
  const byId: Record<string, EquipmentWork> = Object.fromEntries(
    equipment.map((item) => [
      item.id,
      {
        equipmentId: item.id,
        completedJobs: 0,
        associatedWorkPaise: 0,
        operatingHours: 0,
        operatingHoursComplete: true,
        serviceAcres: 0,
        trips: 0,
        trend: [],
        partners: [],
        history: [],
      },
    ]),
  );
  for (const job of complete) {
    const jobAssets = new Set<string>();
    const partnerJobs = new Map<string, Set<string>>();
    for (const line of job.lines) {
      const ids = [...new Set(line.equipmentIds)].filter((id) => byId[id]);
      for (const id of ids) {
        const row = byId[id];
        jobAssets.add(id);
        row.associatedWorkPaise += line.totalPaise;
        const hours = Number(line.operatingHours ?? 0);
        if (line.operatingHours === undefined)
          row.operatingHoursComplete = false;
        row.operatingHours += hours;
        if (line.unit === "ACRE") row.serviceAcres += Number(line.quantity);
        if (line.unit === "TRIP") row.trips += Number(line.quantity);
        const month = job.workDate.slice(0, 7);
        let trend = row.trend.find((entry) => entry.month === month);
        if (!trend) {
          trend = {
            month,
            jobs: 0,
            workPaise: 0,
            hours: 0,
            acres: 0,
            trips: 0,
          };
          row.trend.push(trend);
        }
        trend.workPaise += line.totalPaise;
        trend.hours += hours;
        trend.acres += line.unit === "ACRE" ? Number(line.quantity) : 0;
        trend.trips += line.unit === "TRIP" ? Number(line.quantity) : 0;
        row.history.push({
          jobId: job.id,
          date: job.workDate,
          service: line.serviceNameSnapshot,
          equipmentIds: ids,
          quantity: line.quantity,
          unit: line.unit,
          workPaise: line.totalPaise,
        });
        for (const otherId of ids) {
          if (otherId === id) continue;
          const key = id + ":" + otherId;
          if (!partnerJobs.has(key)) partnerJobs.set(key, new Set());
          partnerJobs.get(key)!.add(job.id);
          let partner = row.partners.find(
            (entry) => entry.equipmentId === otherId,
          );
          if (!partner) {
            partner = {
              equipmentId: otherId,
              jobs: 0,
              workPaise: 0,
              hours: 0,
              acres: 0,
              trips: 0,
            };
            row.partners.push(partner);
          }
          partner.workPaise += line.totalPaise;
          partner.hours += hours;
          partner.acres += line.unit === "ACRE" ? Number(line.quantity) : 0;
          partner.trips += line.unit === "TRIP" ? Number(line.quantity) : 0;
        }
      }
    }
    for (const id of jobAssets) {
      const row = byId[id];
      row.completedJobs += 1;
      const trend = row.trend.find(
        (entry) => entry.month === job.workDate.slice(0, 7),
      );
      if (trend) trend.jobs += 1;
    }
    for (const [key, ids] of partnerJobs) {
      const [id, otherId] = key.split(":");
      const partner = byId[id]?.partners.find(
        (entry) => entry.equipmentId === otherId,
      );
      if (partner) partner.jobs += ids.size;
    }
  }
  for (const row of Object.values(byId)) {
    const asset = equipment.find((item) => item.id === row.equipmentId);
    const availability =
      from && to
        ? asset?.availabilityRecords?.find(
            (entry) => entry.from === from && entry.to === to,
          )
        : undefined;
    if (availability) {
      row.availableHours = availability.hours;
      if (availability.hours > 0 && row.operatingHoursComplete)
        row.utilizationPct =
          Math.round((1000 * row.operatingHours) / availability.hours) / 10;
    }
    row.trend.sort((a, b) => a.month.localeCompare(b.month));
    row.history.sort((a, b) => b.date.localeCompare(a.date));
    row.partners.sort((a, b) => b.workPaise - a.workPaise);
  }
  return {
    totalCompletedJobs: complete.length,
    businessWorkPaise: complete.reduce((sum, job) => sum + job.totalPaise, 0),
    byId,
  };
}
