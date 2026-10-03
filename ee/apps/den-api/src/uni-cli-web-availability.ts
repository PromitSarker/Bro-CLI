import { env } from "./env.js"
import { hasUni-CLIWebComplimentaryAccess } from "./uni-cli-web-access.js"

export function uni-cliWebDeploymentAvailable(enabled: boolean) {
  return enabled === true
}

export function isUni-CLIWebAvailable() {
  return uni-cliWebDeploymentAvailable(env.uni-cliWebEnabled)
}

export function uni-cliWebAvailableForOrganization(
  enabled: boolean,
  metadata: Record<string, unknown> | string | null | undefined,
) {
  return uni-cliWebDeploymentAvailable(enabled) || hasUni-CLIWebComplimentaryAccess(metadata)
}

export function isUni-CLIWebAvailableForOrganization(
  metadata: Record<string, unknown> | string | null | undefined,
) {
  return uni-cliWebAvailableForOrganization(env.uni-cliWebEnabled, metadata)
}
