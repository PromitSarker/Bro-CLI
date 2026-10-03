export const UNICLI_DEPLOYMENT_ENV_VAR = "VITE_UNICLI_DEPLOYMENT";

export type UniCliDeployment = "desktop" | "web";

function normalizeDeployment(value: string | undefined): UniCliDeployment {
  const normalized = value?.trim().toLowerCase();
  return normalized === "web" ? "web" : "desktop";
}

export function getUniCliDeployment(): UniCliDeployment {
  const envValue =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_UNICLI_DEPLOYMENT === "string"
      ? import.meta.env.VITE_UNICLI_DEPLOYMENT
      : undefined;

  return normalizeDeployment(envValue);
}

export function isWebDeployment(): boolean {
  return getUniCliDeployment() === "web";
}

export function isDesktopDeployment(): boolean {
  return getUniCliDeployment() === "desktop";
}
