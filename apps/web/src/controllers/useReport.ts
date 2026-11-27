import { useEffect, useState } from "react";
import type { Report, ReportQuery } from "@kisan/contracts";
import { reportClient } from "../services/reports";

export function useReport(query: ReportQuery) {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const key = JSON.stringify(query);
  useEffect(() => {
    const value = JSON.parse(key) as ReportQuery;
    if (!value.from || !value.to || value.from > value.to) {
      setData(null);
      setError(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setData(null);
    reportClient
      .get(value)
      .then((result) => {
        if (active) {
          setData(result);
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
  return { data, loading, error };
}
