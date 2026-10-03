import { env } from "./env.js"
import { hasUniCliWebComplimentaryAccess } from "./uni-cli-web-access.js"

export function uniCliWebDeploymentAvailable(enabled: boolean) {
  return enabled === true
}

export function isUniCliWebAvailable() {
  return uniCliWebDeploymentAvailable(env.uniCliWebEnabled)
}

export function uniCliWebAvailableForOrganization(
  enabled: boolean,
  metadata: Record<string, unknown> | string | null | undefined,
) {
  return uniCliWebDeploymentAvailable(enabled) || hasUniCliWebComplimentaryAccess(metadata)
}

export function isUniCliWebAvailableForOrganization(
  metadata: Record<string, unknown> | string | null | undefined,
) {
  return uniCliWebAvailableForOrganization(env.uniCliWebEnabled, metadata)
}
