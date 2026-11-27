import { recordResources } from "./records";
import { billingResources } from "./billing";
import { paymentResources } from "./payments";
import { dashboardResources } from "./dashboard";
import { reportResources } from "./reports";
import { settingsResources } from "./settings";

import { workResources } from "./work";
import { catalogResources } from "./catalog";
import { farmerResources } from "./farmers";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { languageSchema } from "@kisan/contracts";
import { authResources } from "./auth";
import { resources } from "./resources";

const storageKey = "kisan-language";
export async function setupLanguage() {
  document.documentElement.dataset.textSize =
    localStorage.getItem("kisan-text-size") === "LARGE" ? "large" : "standard";
  const preferred = languageSchema.safeParse(localStorage.getItem(storageKey));
  await i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: {
          ...resources.en.translation,
          auth: authResources.en,
          catalog: catalogResources.en,
          work: workResources.en,

          records: recordResources.en,
          billing: billingResources.en,
          payments: paymentResources.en,
          dashboard: dashboardResources.en,
          reports: reportResources.en,
          settings: settingsResources.en,
          farmers: farmerResources.en,
        },
      },
      te: {
        translation: {
          ...resources.te.translation,
          auth: authResources.te,
          catalog: catalogResources.te,
          work: workResources.te,

          records: recordResources.te,
          billing: billingResources.te,
          payments: paymentResources.te,
          dashboard: dashboardResources.te,
          reports: reportResources.te,
          settings: settingsResources.te,
          farmers: farmerResources.te,
        },
      },
      hi: {
        translation: {
          ...resources.hi.translation,
          auth: authResources.hi,
          catalog: catalogResources.hi,
          work: workResources.hi,

          records: recordResources.hi,
          billing: billingResources.hi,
          payments: paymentResources.hi,
          dashboard: dashboardResources.hi,
          reports: reportResources.hi,
          settings: settingsResources.hi,
          farmers: farmerResources.hi,
        },
      },
    },
    lng: preferred.success ? preferred.data : "en",
    fallbackLng: "en",
    supportedLngs: ["en", "te", "hi"],
    interpolation: { escapeValue: false },
  });
  document.documentElement.lang = i18n.language;
  i18n.on("languageChanged", (language) => {
    document.documentElement.lang = language;
    localStorage.setItem(storageKey, language);
  });
}
