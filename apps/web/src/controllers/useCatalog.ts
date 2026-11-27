import { useEffect, useState } from "react";
import type {
  CatalogQuery,
  Equipment,
  Service,
  PageResult,
} from "@kisan/contracts";
import { catalogClient } from "../services/catalog";

export function useCatalog(query: CatalogQuery, tab: "equipment" | "services") {
  const [state, setState] = useState<{
    items: (Equipment | Service)[];
    total: number;
    loading: boolean;
    error: boolean;
  }>({ items: [], total: 0, loading: true, error: false });
  const [revision, refresh] = useState(0);
  const { page, pageSize, active } = query;
  useEffect(() => {
    let current = true;
    setState({ items: [], total: 0, loading: true, error: false });
    const request: Promise<PageResult<Equipment | Service>> = catalogClient[
      tab
    ]({ page, pageSize, active });
    void request.then(
      (data) => {
        if (current) setState({ ...data, loading: false, error: false });
      },
      () => {
        if (current)
          setState({ items: [], total: 0, loading: false, error: true });
      },
    );
    return () => {
      current = false;
    };
  }, [page, pageSize, active, tab, revision]);
  return { ...state, refresh: () => refresh((value) => value + 1) };
}

export function useEquipmentOptions() {
  const [state, setState] = useState<{
    items: Equipment[];
    loading: boolean;
    error: boolean;
  }>({ items: [], loading: true, error: false });
  useEffect(() => {
    let current = true;
    async function load() {
      const items: Equipment[] = [];
      let page = 1;
      while (true) {
        const result = await catalogClient.equipment({
          page,
          pageSize: 100,
          active: "all",
        });
        items.push(...result.items);
        if (!current) return;
        if (page * 100 >= result.total) break;
        page += 1;
      }
      if (current) setState({ items, loading: false, error: false });
    }
    void load().catch(() => {
      if (current) setState({ items: [], loading: false, error: true });
    });
    return () => {
      current = false;
    };
  }, []);
  return state;
}
