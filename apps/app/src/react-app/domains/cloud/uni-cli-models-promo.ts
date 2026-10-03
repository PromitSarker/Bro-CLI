import { INFERENCE_MODEL_ALIASES } from "@uni-cli/types/den/inference";

import {
  buildDenAuthUrl,
  getDenInferenceUrl,
  isSelfHostedControlPlane,
  HOSTED_DEFAULT_DEN_BASE_URL,
  readDenBootstrapConfig,
  readDenSettings,
} from "../../../app/lib/den";
import { isDefaultControlPlaneUrl } from "../settings/cloud/control-plane-url";
import { denSettingsChangedEvent } from "../../../app/lib/den-session-events";
import { useSyncExternalStore } from "react";

export const UNICLI_MODELS_PROVIDER_ID = "uni-cli";
export const UNICLI_MODELS_PROVIDER_NAME = "Uni-CLI Models";
export const UNICLI_MODELS_PROMO_HIDDEN_KEY = "uni-cli.uni-cliModelsPromo.hidden";
export const UNICLI_MODELS_PROMO_LAST_SHOWN_KEY = "uni-cli.uni-cliModelsPromo.lastShownAt";
export const UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY = "uni-cli.uni-cliModelsPromo.startupShown";
export const uni-cliModelsPromoChangedEvent = "uni-cli-uni-cli-models-promo-changed";
export const UNICLI_MODELS_PROMO_SHOW_DELAY_MS = 4_000;
export const UNICLI_MODELS_PROMO_VISIBLE_MS = 14_000;
export const UNICLI_MODELS_PROMO_REPEAT_MS = 6 * 60 * 60 * 1000;

export function areUni-CLIModelsPromosDisabled() {
  if (/^(1|true|yes|on)$/i.test(String(import.meta.env.VITE_DISABLE_UNICLI_MODELS ?? "").trim())) {
    return true;
  }
  // Uni-CLI Models are a hosted Uni-CLI Cloud offering; self-hosted
  // deployments should never see the upsell surfaces.
  return isSelfHostedControlPlane();
}

export function isUni-CLIModelsPromoEligibleForDenBaseUrl(baseUrl: string) {
  return !areUni-CLIModelsPromosDisabled() && isDefaultControlPlaneUrl(baseUrl, HOSTED_DEFAULT_DEN_BASE_URL);
}

export function isUni-CLIModelsPromoEligible() {
  return isUni-CLIModelsPromoEligibleForDenBaseUrl(readDenSettings().baseUrl);
}

export function useUni-CLIModelsPromoEligibility() {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener(denSettingsChangedEvent, notify);
      return () => window.removeEventListener(denSettingsChangedEvent, notify);
    },
    isUni-CLIModelsPromoEligible,
    isUni-CLIModelsPromoEligible,
  );
}

export type Uni-CLIModelPreview = {
  id: string;
  title: string;
  subtitle: string;
};

export const UNICLI_MODEL_PREVIEWS: Uni-CLIModelPreview[] = Object.entries(
  INFERENCE_MODEL_ALIASES,
)
  .filter(([, model]) => model.enabled)
  .map(([id, model]) => ({
    id,
    title: model.displayName.replace(/^Uni-CLI:\s*/, ""),
    subtitle: "Uni-CLI hosted",
  }));

export function hasUni-CLIModelsProvider(providerIds: readonly string[]) {
  return providerIds.some((id) => id.trim().toLowerCase() === UNICLI_MODELS_PROVIDER_ID);
}

/** Local engine has Uni-CLI Models connected with at least one selectable model. */
export function hasUni-CLIModelsAvailable(input: {
  providerConnectedIds: readonly string[];
  providers: ReadonlyArray<{ id: string; models?: Record<string, unknown> | null }>;
}) {
  if (!hasUni-CLIModelsProvider(input.providerConnectedIds)) return false;
  const uni-cli = input.providers.find(
    (provider) => provider.id.trim().toLowerCase() === UNICLI_MODELS_PROVIDER_ID,
  );
  return Object.keys(uni-cli?.models ?? {}).length > 0;
}

export function shouldShowUni-CLIModelsSyncing(input: {
  entitled: boolean;
  available: boolean;
  workspaceReady: boolean;
  reloadPending: boolean;
}) {
  return input.entitled && !input.available && input.workspaceReady && input.reloadPending;
}

export function getUni-CLIModelsActionUrl(
  isSignedIn: boolean,
  authMode: "sign-in" | "sign-up" = "sign-in",
) {
  const settings = readDenSettings();
  const baseUrl = settings.baseUrl || readDenBootstrapConfig().baseUrl;
  // Signed-in users go straight to the Uni-CLI Models page — the value-prop
  // + subscribe surface — never to a bare auth or billing page.
  return isSignedIn ? getDenInferenceUrl(baseUrl) : buildDenAuthUrl(baseUrl, authMode);
}

export function isUni-CLIModelsPromoHidden() {
  if (areUni-CLIModelsPromosDisabled()) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UNICLI_MODELS_PROMO_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function hideUni-CLIModelsPromo() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_PROMO_HIDDEN_KEY, "1");
    window.dispatchEvent(new Event(uni-cliModelsPromoChangedEvent));
  } catch {}
}

export function wasUni-CLIModelsStartupPromoShown() {
  if (!isUni-CLIModelsPromoEligible()) return true;
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markUni-CLIModelsStartupPromoShown() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY, "1");
  } catch {}
}

export function shouldShowUni-CLIModelsPromo(now = Date.now()) {
  if (!isUni-CLIModelsPromoEligible() || typeof window === "undefined" || isUni-CLIModelsPromoHidden()) return false;
  try {
    const lastShown = Number(window.localStorage.getItem(UNICLI_MODELS_PROMO_LAST_SHOWN_KEY) ?? "0");
    return !Number.isFinite(lastShown) || now - lastShown >= UNICLI_MODELS_PROMO_REPEAT_MS;
  } catch {
    return true;
  }
}

export function markUni-CLIModelsPromoShown(now = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_PROMO_LAST_SHOWN_KEY, String(now));
  } catch {}
}
