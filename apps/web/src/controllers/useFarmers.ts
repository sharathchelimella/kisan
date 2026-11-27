import { useEffect, useState } from "react";
import { farmersClient } from "../services/farmers";
import type { FarmerPage, FarmerQuery } from "@kisan/contracts";

export function useFarmers(query: FarmerQuery) {
  const [state, setState] = useState<{
    data?: FarmerPage;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [revision, refresh] = useState(0);
  const { page, pageSize, q, village, archived } = query;
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    void farmersClient.list({ page, pageSize, q, village, archived }).then(
      (data) => {
        if (active) setState({ data, loading: false });
      },
      () => {
        if (active) setState({ error: "error", loading: false });
      },
    );
    return () => {
      active = false;
    };
  }, [page, pageSize, q, village, archived, revision]);
  return { ...state, refresh: () => refresh((value) => value + 1) };
}
