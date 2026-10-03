import { NextResponse } from "next/server";
import { joinBaseUrl, readBaseUrlEnv } from "@uni-cli/types/url";
import { denUrls } from "@uni-cli-ee/utils";
import { DEFAULT_UNICLI_WEB_URL } from "../../(den)/_lib/runtime-config";

export const dynamic = "force-dynamic";

function readPublicRuntimeEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readOrgMode() {
  return readPublicRuntimeEnv("DEN_ORG_MODE") === "multi_org" ? "multi_org" : "single_org";
}

function readDenApiUrl() {
  return readBaseUrlEnv(process.env, "DEN_API_PUBLIC_URL") ?? denUrls(process.env).api;
}

function readBooleanEnv(name: string, defaultValue: boolean) {
  const normalized = readPublicRuntimeEnv(name).toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function readBooleanProperty(value: object, key: string) {
  return Object.getOwnPropertyDescriptor(value, key)?.value === true;
}

async function readSingleOrgSsoConfigured(orgMode: string) {
  if (orgMode !== "single_org") {
    return false;
  }

  const apiBase = readBaseUrlEnv(process.env, "DEN_API_BASE") ?? "";
  if (!apiBase) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
  try {
    const response = await fetch(joinBaseUrl(apiBase, "v1/orgs/sso/singleton"), {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return false;
    }

    const payload: unknown = await response.json();
    return typeof payload === "object" && payload !== null && readBooleanProperty(payload, "configured");
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const orgMode = readOrgMode();
  const singleOrgSsoConfigured = await readSingleOrgSsoConfigured(orgMode);

  return NextResponse.json(
    {
      denApiUrl: readDenApiUrl(),
      uniCliAppConnectUrl: readPublicRuntimeEnv("DEN_WEB_UNICLI_APP_CONNECT_URL"),
      uniCliWebUrl: readPublicRuntimeEnv("DEN_WEB_UNICLI_WEB_URL") || DEFAULT_UNICLI_WEB_URL,
      uniCliAuthCallbackUrl: readPublicRuntimeEnv("DEN_WEB_UNICLI_AUTH_CALLBACK_URL"),
      orgMode,
      singleOrgName: readPublicRuntimeEnv("DEN_SINGLE_ORG_NAME") || "Uni-CLI",
      singleOrgSlug: readPublicRuntimeEnv("DEN_SINGLE_ORG_SLUG") || "default",
      singleOrgAllowPublicSignup: readBooleanEnv("DEN_SINGLE_ORG_ALLOW_PUBLIC_SIGNUP", orgMode === "multi_org"),
      singleOrgSsoConfigured
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
