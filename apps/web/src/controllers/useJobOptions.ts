import { useEffect, useState } from "react";
import type { JobFarmerSummary, JobServiceSummary } from "@kisan/contracts";
import { jobClient } from "../services/jobs";

export function useJobOptions() {
  const [state, setState] = useState<{
    farmers: JobFarmerSummary[];
    services: JobServiceSummary[];
    loading: boolean;
    error: boolean;
  }>({ farmers: [], services: [], loading: true, error: false });
  useEffect(() => {
    let current = true;
    void Promise.all([jobClient.farmers(), jobClient.services()]).then(
      ([farmers, services]) => {
        if (current)
          setState({ farmers, services, loading: false, error: false });
      },
      () => {
        if (current)
          setState({ farmers: [], services: [], loading: false, error: true });
      },
    );
    return () => {
      current = false;
    };
  }, []);
  return state;
}
