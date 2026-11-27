# P11 shared UX and visual QA

Windows runs pixel comparison against the checked-in baselines. Other operating systems capture screenshots under `test-results/` and run the same functional, overflow and touch-target checks until their own baselines are reviewed.

The fixture at `/quality.html` runs on the Vite development server and uses static data. It exercises common financial text, status badges, search and filters, empty/loading states, validation errors, and a native confirmation dialog. It does not post data.

Run `npm run test:e2e -- apps/web/src/tests/quality-fixture.spec.ts` to compare English, Telugu and Hindi snapshots at 360px and 1440px. Run with `--update-snapshots` only after reviewing the rendered differences. The browser test checks horizontal overflow and 48px control targets. Keyboard tests cover dialog opening, Escape, filter clearing and preserving form input after a failed save. `npm test` checks semantic markup and color contrast for the shared palette.

For visual review, inspect all six snapshots for clipped text, focus visibility, currency readability and status wording. The status badges carry text and icons, so color is not the sole status cue. Review at 200% browser zoom and with a screen reader before release.
