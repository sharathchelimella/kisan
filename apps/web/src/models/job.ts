import type {
  Job,
  JobInput,
  JobFarmerSummary,
  JobServiceSummary,
} from "@kisan/contracts";

export interface JobClient {
  farmers(): Promise<JobFarmerSummary[]>;
  services(): Promise<JobServiceSummary[]>;
  save(input: JobInput): Promise<Job>;
}
