import { isuni-cliGatewayRuntime } from "./gateway-runtime";

export function canCreateWorkspaces() {
  return !isuni-cliGatewayRuntime();
}
