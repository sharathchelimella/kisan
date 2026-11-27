# P11 UX and quality decisions

The common components live under `apps/web/src/views/components/common/`. Existing payment StatusBadge and EmptyState are re-exported from their P00 home, avoiding a feature-page rewrite. MoneyText accepts integer paise and uses the active language for INR formatting. Confirmation uses the browser's modal dialog for keyboard focus and Escape behavior.

The static fixture at `/quality.html` is available on the Vite development server and is excluded from the production app route list. It sends no requests. The six Playwright baselines cover English, Telugu and Hindi at 360px and 1440px on Windows; a different operating system needs its own reviewed baselines. Contrast tests cover the shared text/button/error palette. Manual screen-reader and 200% zoom review remains part of the release gate.
