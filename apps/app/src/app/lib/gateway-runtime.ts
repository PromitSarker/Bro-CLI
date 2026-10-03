// Gateway runtime detection primitives. Leaf module by design: keep it import-free
// so low-level clients can choose same-origin gateway behavior without cycles.
export type uniCliGatewayMarker = {
  version?: number;
  build?: string;
};

declare global {
  interface Window {
    __UNICLI_GATEWAY__?: uniCliGatewayMarker;
  }
}

const DEN_AUTH_TOKEN_STORAGE_KEY = "uni-cli.den.authToken";

export function isuniCliGatewayRuntime() {
  return typeof window !== "undefined" && window.__UNICLI_GATEWAY__?.version === 1;
}

export function getuniCliGatewayBuild(): string | null {
  if (!isuniCliGatewayRuntime()) return null;
  const build = window.__UNICLI_GATEWAY__?.build?.trim() ?? "";
  return build || null;
}

export function getuniCliGatewayOrigin() {
  if (!isuniCliGatewayRuntime()) return null;
  const origin = window.location.origin.trim();
  return origin || null;
}

export function readuniCliGatewayDenToken() {
  if (!isuniCliGatewayRuntime()) return "";
  try {
    return window.localStorage.getItem(DEN_AUTH_TOKEN_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}
