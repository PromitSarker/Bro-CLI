/**
 * Organization entitlement for Uni-CLI VM execution.
 *
 * Desktop-first rollout, already complete on the client side: published
 * desktop builds since v0.18.42 (#4214) wrap the hosted gateway runtime in
 * `UniCliWebAccessGate`
 * (apps/app/src/react-app/domains/cloud/uni-cli-web-access-gate.tsx), which
 * resolves Web access through `GET /v1/org` + `GET /v1/billing/web` and renders
 * the access screen before any Cloud instance, worker, or remote-session route
 * is called. Desktop builds older than v0.18.42 are covered too: since #4214
 * the hosted origin itself (`/v1/cloud/gateway/resolve`, consumed by
 * den-gateway) has returned `403 uni-cli_web_access_required` for an
 * organization without Web access, so no published build in an unentitled
 * organization reaches the Cloud instance, worker token, proxy, or
 * remote-session routes without already having been denied at the origin.
 *
 * The den-side `403 uni-cli_web_access_required` responses that use this
 * module are the second phase: defense in depth for callers that bypass the
 * gate and for entitlement that lapses mid-session. An organization with
 * active Web access observes no wire change on any existing route, and the
 * error code is already part of the shared Automation contract in
 * packages/types/src/automations.ts.
 */
import { normalizeDenTypeId } from "@uni-cli-ee/utils/typeid"
import { UniCliWebAccessRequiredError } from "./uni-cli-web-access-error.js"
import { getUniCliWebAccess } from "./stripe-billing.js"

export {
  UNICLI_WEB_ACCESS_REQUIRED_CODE,
  UNICLI_WEB_ACCESS_REQUIRED_MESSAGE,
  UniCliWebAccessRequiredError,
  uniCliWebAccessRequiredPayload,
} from "./uni-cli-web-access-error.js"

export type UniCliWebRuntimeAccess = {
  hasAccess: boolean
}

export type UniCliWebRuntimeAccessResolver = (
  organizationId: string,
) => Promise<UniCliWebRuntimeAccess>

export const getUniCliWebRuntimeAccess: UniCliWebRuntimeAccessResolver = async (organizationId) => {
  const access = await getUniCliWebAccess(
    normalizeDenTypeId("organization", organizationId),
  )
  return { hasAccess: access.hasAccess }
}

export async function requireUniCliWebRuntimeAccess(
  organizationId: string,
  resolveAccess: UniCliWebRuntimeAccessResolver = getUniCliWebRuntimeAccess,
) {
  const access = await resolveAccess(organizationId)
  if (!access.hasAccess) {
    throw new UniCliWebAccessRequiredError()
  }
  return access
}
