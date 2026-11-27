import { useCallback, useEffect, useState } from "react";
import {
  jobQuerySchema,
  type JobPage,
  type JobQuery,
  type JobRecord,
} from "@kisan/contracts";
import { jobReadClient } from "../services/job-records";

export function useJobRecords(query: JobQuery) {
  const [page, setPage] = useState<JobPage | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(query);
  useEffect(() => {
    let active = true;
    jobReadClient
      .list(jobQuerySchema.parse(JSON.parse(key)))
      .then((result) => {
        if (active) {
          setPage(result);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key]);
  return { page, error, loading };
}
export function useJobRecord(id: string) {
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRecord(await jobReadClient.get(id));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { record, loading, error, reload, setRecord };
}
