import type { DenUni-CLIWebAccessSource } from "../../../app/lib/den";

export type Uni-CLIWebAccessCheck = {
  scope: string;
  state: "granted" | "denied" | "error";
  accessSource: DenUni-CLIWebAccessSource;
};

export type Uni-CLIWebAccessGateState = "inactive" | "checking" | "granted" | "denied" | "error";

export function resolveUni-CLIWebAccessGateState(input: {
  gatewayMode: boolean;
  authStatus: "checking" | "signed_in" | "unavailable" | "signed_out";
  authToken: string;
  organizationId: string;
  verifiedIdentity: { principalId: string; organizationId: string } | null;
  expectedScope: string | null;
  check: Uni-CLIWebAccessCheck | null;
}): Uni-CLIWebAccessGateState {
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
