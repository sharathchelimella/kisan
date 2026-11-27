import { useEffect, useState } from "react";
import { farmersClient } from "../services/farmers";
import { catalogClient } from "../services/catalog";
import { demoReportOptions } from "../mocks/reports";

type Option = { id: string; name: string };
export function useReportOptions() {
  const mock =
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true";
  const [farmers, setFarmers] = useState<Option[]>(
    mock ? demoReportOptions.farmers : [],
  );
  const [equipment, setEquipment] = useState<Option[]>(
    mock ? demoReportOptions.equipment : [],
  );
  const [services, setServices] = useState<Option[]>(
    mock ? demoReportOptions.services : [],
  );
  useEffect(() => {
    if (mock) return;
    let active = true;
    Promise.all([
      farmersClient.list({ page: 1, pageSize: 100, archived: "false" }),
      catalogClient.equipment({ page: 1, pageSize: 100, active: "all" }),
      catalogClient.services({ page: 1, pageSize: 100, active: "all" }),
    ])
      .then(([farmerPage, equipmentPage, servicePage]) => {
        if (active) {
          setFarmers(farmerPage.items.map(({ id, name }) => ({ id, name })));
          setEquipment(
            equipmentPage.items.map(({ id, name }) => ({ id, name })),
          );
          setServices(servicePage.items.map(({ id, name }) => ({ id, name })));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mock]);
  return { farmers, equipment, services };
}
