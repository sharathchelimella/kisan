import { useEffect, useState } from "react";
import type { Session } from "@kisan/contracts";
import { authClient } from "../services/auth";

type SessionState =
  | { status: "loading" | "error" }
  | { status: "ready"; session: Session | null };

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    void authClient.me().then(
      (session) => {
        if (active) setState({ status: "ready", session });
      },
      () => {
        if (active) setState({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    state,
    retry: () => {
      setState({ status: "loading" });
      retry((previous) => previous + 1);
    },
    setSession: (session: Session | null) =>
      setState({ status: "ready", session }),
  };
}
