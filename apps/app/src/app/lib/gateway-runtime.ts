// Gateway runtime detection primitives. Leaf module by design: keep it import-free
// so low-level clients can choose same-origin gateway behavior without cycles.
export type uni-cliGatewayMarker = {
  version?: number;
  build?: string;
};

declare global {
  interface Window {
    __UNICLI_GATEWAY__?: uni-cliGatewayMarker;
  }
}

const DEN_AUTH_TOKEN_STORAGE_KEY = "uni-cli.den.authToken";

export function isuni-cliGatewayRuntime() {
  return typeof window !== "undefined" && window.__UNICLI_GATEWAY__?.version === 1;
}

export function getuni-cliGatewayBuild(): string | null {
  if (!isuni-cliGatewayRuntime()) return null;
  const build = window.__UNICLI_GATEWAY__?.build?.trim() ?? "";
  return build || null;
}

export function getuni-cliGatewayOrigin() {
  if (!isuni-cliGatewayRuntime()) return null;
  const origin = window.location.origin.trim();
  return origin || null;
}

export function readuni-cliGatewayDenToken() {
  if (!isuni-cliGatewayRuntime()) return "";
  try {
    return window.localStorage.getItem(DEN_AUTH_TOKEN_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}
