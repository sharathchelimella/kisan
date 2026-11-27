import { useEffect, useState } from "react";
import type { Dashboard } from "@kisan/contracts";
import { dashboardClient } from "../services/dashboard";

export function useDashboard(query: Pick<Dashboard, "from" | "to" | "asOf">) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { from, to, asOf } = query;
  useEffect(() => {
    let active = true;
    if (!from || !to || from > to) {
      setData(null);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setData(null);
    dashboardClient
      .summary({ from, to, asOf })
      .then((value) => {
        if (active) {
          setData(value);
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
  }, [from, to, asOf]);
  return { data, loading, error };
}
