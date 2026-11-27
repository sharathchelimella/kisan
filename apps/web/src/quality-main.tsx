import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import i18n from "i18next";
import "@fontsource-variable/inter";
import "@fontsource/noto-sans-telugu/telugu-400.css";
import "@fontsource/noto-sans-telugu/telugu-600.css";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-600.css";
import { tokens } from "@kisan/design-tokens";
import { setupLanguage } from "./i18n";
import { qualityResources } from "./i18n/quality";
import { QualityFixture } from "./views/components/common/quality-fixture";
import "./styles.css";

for (const [name, value] of Object.entries(tokens))
  document.documentElement.style.setProperty(`--${name}`, value);
void setupLanguage().then(() => {
  for (const [language, resources] of Object.entries(qualityResources))
    i18n.addResourceBundle(language, "quality", resources);
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QualityFixture />
    </StrictMode>,
  );
});
