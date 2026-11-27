import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  settingsSchema,
  languageSchema,
  textSizeSchema,
  type Settings,
  type SettingsUpdate,
} from "@kisan/contracts";
import { demoSession } from "../mocks/auth";

export interface SettingsClient {
  get(): Promise<Settings>;
  update(input: SettingsUpdate): Promise<Settings>;
}
const http: SettingsClient = {
  async get() {
    const res = await fetch(`${API_PREFIX}/settings`);
    if (!res.ok) throw new Error("Settings unavailable");
    return settingsSchema.parse((await res.json()).data);
  },
  async update(input) {
    const res = await fetch(`${API_PREFIX}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        [AUTH_REQUEST_HEADER]: "1",
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Could not save settings");
    return settingsSchema.parse((await res.json()).data);
  },
};
let demoSettings: Settings = {
  businessName: demoSession.business.name,
  village: demoSession.business.village,
  phone: "",
  address: "",
  timezone: demoSession.business.timezone,
  invoicePrefix: demoSession.business.invoicePrefix,
  nextInvoiceSequence: 2,
  ownerDisplayName: demoSession.owner.displayName,
  ownerMobile: "",
  preferredLanguage: demoSession.owner.preferredLanguage,
  notificationsOptIn: false,
  textSize: "STANDARD",
};
const demoStorageKey = "kisan-demo-settings";
function syncDemoSession(settings: Settings) {
  demoSession.business.name = settings.businessName;
  demoSession.business.village = settings.village;
  demoSession.business.phone = settings.phone;
  demoSession.business.address = settings.address;
  demoSession.owner.displayName = settings.ownerDisplayName;
  demoSession.owner.mobile = settings.ownerMobile;
  demoSession.owner.preferredLanguage = settings.preferredLanguage;
}
const demo: SettingsClient = {
  async get() {
    try {
      const stored = localStorage.getItem(demoStorageKey);
      if (stored) {
        const parsed = settingsSchema.safeParse(JSON.parse(stored));
        if (parsed.success) demoSettings = parsed.data;
      }
    } catch {
      // Ignore invalid demo data and retain the sample profile.
    }
    const language = languageSchema.safeParse(
      localStorage.getItem("kisan-language"),
    );
    const size = textSizeSchema.safeParse(
      localStorage.getItem("kisan-text-size"),
    );
    demoSettings.preferredLanguage = language.success
      ? language.data
      : demoSettings.preferredLanguage;
    demoSettings.textSize = size.success ? size.data : demoSettings.textSize;
    syncDemoSession(demoSettings);
    return { ...demoSettings };
  },
  async update(input) {
    demoSettings = settingsSchema.parse({ ...demoSettings, ...input });
    localStorage.setItem(demoStorageKey, JSON.stringify(demoSettings));
    syncDemoSession(demoSettings);
    return { ...demoSettings };
  },
};
export const settingsClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demo
    : http;
