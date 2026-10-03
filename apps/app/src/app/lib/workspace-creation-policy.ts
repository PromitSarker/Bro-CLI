import { isuniCliGatewayRuntime } from "./gateway-runtime";

export function canCreateWorkspaces() {
  return !isuniCliGatewayRuntime();
}
