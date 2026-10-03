import type { DenUniCliWebAccessSource } from "../../../app/lib/den";

export type UniCliWebAccessCheck = {
  scope: string;
  state: "granted" | "denied" | "error";
  accessSource: DenUniCliWebAccessSource;
};

export type UniCliWebAccessGateState = "inactive" | "checking" | "granted" | "denied" | "error";

export function resolveUniCliWebAccessGateState(input: {
  gatewayMode: boolean;
  authStatus: "checking" | "signed_in" | "unavailable" | "signed_out";
  authToken: string;
  organizationId: string;
  verifiedIdentity: { principalId: string; organizationId: string } | null;
  expectedScope: string | null;
  check: UniCliWebAccessCheck | null;
}): UniCliWebAccessGateState {
  if (!input.gatewayMode || !input.authToken || !input.organizationId) return "inactive";
  if (input.authStatus === "unavailable") return "error";
  if (input.authStatus !== "signed_in") return "checking";
  if (
    !input.verifiedIdentity
    || input.verifiedIdentity.organizationId !== input.organizationId
    || !input.expectedScope
  ) {
    return "checking";
  }
  if (!input.check || input.check.scope !== input.expectedScope) return "checking";
  return input.check.state;
}
