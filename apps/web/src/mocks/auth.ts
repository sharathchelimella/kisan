import type { Session } from "@kisan/contracts";
import type { AuthClient } from "../services/auth";

export const demoSession: Session = {
  owner: {
    id: "DEMO-owner",
    displayName: "DEMO Owner",
    role: "OWNER",
    preferredLanguage: "en",
  },
  business: {
    id: "DEMO-business-1",
    name: "DEMO Business",
    village: "DEMO Village",
    timezone: "Asia/Kolkata",
    invoicePrefix: "KMM",
  },
};
const signedOut = "kisan-demo-signed-out";

export const demoAuth: AuthClient = {
  async me() {
    return sessionStorage.getItem(signedOut) ? null : demoSession;
  },
  async login() {
    sessionStorage.removeItem(signedOut);
    return demoSession;
  },
  async register() {
    throw new Error("AUTH_UNAVAILABLE");
  },
  async logout() {
    sessionStorage.setItem(signedOut, "1");
  },
};
