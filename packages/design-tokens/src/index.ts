export const tokens = {
  // Agricultural Color Palette
  "primary-dark": "#064E3B",
  "sidebar-dark": "#06472F",
  "primary-action": "#15803D",
  "success-green": "#16A34A",
  "secondary-green": "#65C95B",
  "light-green": "#E8F5E9",
  canvas: "#F7F9F8",
  surface: "#FFFFFF",
  text: "#14251C",
  muted: "#64748B",
  border: "#E2E8E5",
  warning: "#F59E0B",
  danger: "#DC2626",
  teal: "#2CB89A",

  // Legacy mappings for backwards-compatibility
  "green-950": "#064E3B",
  "green-900": "#06472F",
  "green-700": "#15803D",
  "green-600": "#16A34A",
  "green-500": "#65C95B",
  "green-100": "#E8F5E9",
  "green-50": "#F2F9F3",

  // Radii & Spacing
  "card-radius": "16px",
  "card-radius-sm": "12px",
  "button-radius": "10px",
  "card-padding": "24px",
  "card-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
  "card-shadow-hover": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  "sidebar-width": "248px",
  "touch-size": "48px",
} as const;

export type DesignTokens = typeof tokens;
