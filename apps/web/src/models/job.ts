import type {
  Job,
  JobInput,
  JobFarmerSummary,
  JobServiceSummary,
} from "@kisan/contracts";

export interface JobClient {
  farmers(): Promise<
    (JobFarmerSummary & {
      mobile?: string;
      pendingAmountPaise?: number;
      totalWorks?: number;
    })[]
  >;
  services(): Promise<JobServiceSummary[]>;
  save(input: JobInput): Promise<Job>;
}
