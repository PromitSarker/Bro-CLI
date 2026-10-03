export const UNICLI_DEPLOYMENT_ENV_VAR = "VITE_UNICLI_DEPLOYMENT";

export type Uni-CLIDeployment = "desktop" | "web";

function normalizeDeployment(value: string | undefined): Uni-CLIDeployment {
  const normalized = value?.trim().toLowerCase();
  return normalized === "web" ? "web" : "desktop";
}

export function getUni-CLIDeployment(): Uni-CLIDeployment {
  const envValue =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_UNICLI_DEPLOYMENT === "string"
      ? import.meta.env.VITE_UNICLI_DEPLOYMENT
      : undefined;

  return normalizeDeployment(envValue);
}

export function isWebDeployment(): boolean {
  return getUni-CLIDeployment() === "web";
}

export function isDesktopDeployment(): boolean {
  return getUni-CLIDeployment() === "desktop";
}
