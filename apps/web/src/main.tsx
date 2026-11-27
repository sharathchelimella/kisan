import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource/noto-sans-telugu/telugu-400.css";
import "@fontsource/noto-sans-telugu/telugu-600.css";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-600.css";
import { tokens } from "@kisan/design-tokens";
import { setupLanguage } from "./i18n";
import { App } from "./App";
import "./styles.css";

for (const [name, value] of Object.entries(tokens)) {
  document.documentElement.style.setProperty(`--${name}`, value);
}

void setupLanguage().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
