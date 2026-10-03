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
export const UNICLI_MODELS_PROMO_HIDDEN_KEY = "uni-cli.uniCliModelsPromo.hidden";
export const UNICLI_MODELS_PROMO_LAST_SHOWN_KEY = "uni-cli.uniCliModelsPromo.lastShownAt";
export const UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY = "uni-cli.uniCliModelsPromo.startupShown";
export const uniCliModelsPromoChangedEvent = "uni-cli-uni-cli-models-promo-changed";
export const UNICLI_MODELS_PROMO_SHOW_DELAY_MS = 4_000;
export const UNICLI_MODELS_PROMO_VISIBLE_MS = 14_000;
export const UNICLI_MODELS_PROMO_REPEAT_MS = 6 * 60 * 60 * 1000;

export function areUniCliModelsPromosDisabled() {
  if (/^(1|true|yes|on)$/i.test(String(import.meta.env.VITE_DISABLE_UNICLI_MODELS ?? "").trim())) {
    return true;
  }
  // Uni-CLI Models are a hosted Uni-CLI Cloud offering; self-hosted
  // deployments should never see the upsell surfaces.
  return isSelfHostedControlPlane();
}

export function isUniCliModelsPromoEligibleForDenBaseUrl(baseUrl: string) {
  return !areUniCliModelsPromosDisabled() && isDefaultControlPlaneUrl(baseUrl, HOSTED_DEFAULT_DEN_BASE_URL);
}

export function isUniCliModelsPromoEligible() {
  return isUniCliModelsPromoEligibleForDenBaseUrl(readDenSettings().baseUrl);
}

export function useUniCliModelsPromoEligibility() {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener(denSettingsChangedEvent, notify);
      return () => window.removeEventListener(denSettingsChangedEvent, notify);
    },
    isUniCliModelsPromoEligible,
    isUniCliModelsPromoEligible,
  );
}

export type UniCliModelPreview = {
  id: string;
  title: string;
  subtitle: string;
};

export const UNICLI_MODEL_PREVIEWS: UniCliModelPreview[] = Object.entries(
  INFERENCE_MODEL_ALIASES,
)
  .filter(([, model]) => model.enabled)
  .map(([id, model]) => ({
    id,
    title: model.displayName.replace(/^Uni-CLI:\s*/, ""),
    subtitle: "Uni-CLI hosted",
  }));

export function hasUniCliModelsProvider(providerIds: readonly string[]) {
  return providerIds.some((id) => id.trim().toLowerCase() === UNICLI_MODELS_PROVIDER_ID);
}

/** Local engine has Uni-CLI Models connected with at least one selectable model. */
export function hasUniCliModelsAvailable(input: {
  providerConnectedIds: readonly string[];
  providers: ReadonlyArray<{ id: string; models?: Record<string, unknown> | null }>;
}) {
  if (!hasUniCliModelsProvider(input.providerConnectedIds)) return false;
  const uniCli = input.providers.find(
    (provider) => provider.id.trim().toLowerCase() === UNICLI_MODELS_PROVIDER_ID,
  );
  return Object.keys(uniCli?.models ?? {}).length > 0;
}

export function shouldShowUniCliModelsSyncing(input: {
  entitled: boolean;
  available: boolean;
  workspaceReady: boolean;
  reloadPending: boolean;
}) {
  return input.entitled && !input.available && input.workspaceReady && input.reloadPending;
}

export function getUniCliModelsActionUrl(
  isSignedIn: boolean,
  authMode: "sign-in" | "sign-up" = "sign-in",
) {
  const settings = readDenSettings();
  const baseUrl = settings.baseUrl || readDenBootstrapConfig().baseUrl;
  // Signed-in users go straight to the Uni-CLI Models page — the value-prop
  // + subscribe surface — never to a bare auth or billing page.
  return isSignedIn ? getDenInferenceUrl(baseUrl) : buildDenAuthUrl(baseUrl, authMode);
}

export function isUniCliModelsPromoHidden() {
  if (areUniCliModelsPromosDisabled()) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UNICLI_MODELS_PROMO_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function hideUniCliModelsPromo() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_PROMO_HIDDEN_KEY, "1");
    window.dispatchEvent(new Event(uniCliModelsPromoChangedEvent));
  } catch {}
}

export function wasUniCliModelsStartupPromoShown() {
  if (!isUniCliModelsPromoEligible()) return true;
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markUniCliModelsStartupPromoShown() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_STARTUP_PROMO_SHOWN_KEY, "1");
  } catch {}
}

export function shouldShowUniCliModelsPromo(now = Date.now()) {
  if (!isUniCliModelsPromoEligible() || typeof window === "undefined" || isUniCliModelsPromoHidden()) return false;
  try {
    const lastShown = Number(window.localStorage.getItem(UNICLI_MODELS_PROMO_LAST_SHOWN_KEY) ?? "0");
    return !Number.isFinite(lastShown) || now - lastShown >= UNICLI_MODELS_PROMO_REPEAT_MS;
  } catch {
    return true;
  }
}

export function markUniCliModelsPromoShown(now = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UNICLI_MODELS_PROMO_LAST_SHOWN_KEY, String(now));
  } catch {}
}
