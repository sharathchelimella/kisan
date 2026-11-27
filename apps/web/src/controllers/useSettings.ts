import { useEffect, useState } from "react";
import type { Settings } from "@kisan/contracts";
import { settingsClient } from "../services/settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    settingsClient
      .get()
      .then((value) => {
        if (active) {
          setSettings(value);
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
  }, []);
  return { settings, setSettings, loading, error, setError };
}
