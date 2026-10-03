import { gatewayBearerKey } from "@uni-cli-ee/utils/gateway-bearer-key"
import { createMiddleware } from "hono/factory"
import type { findActiveGatewayKey } from "../keys.js"
import { buildRequestId } from "../relay.js"
import { readUni-CLIKey, type InferenceAuthEnv } from "./inference-auth.js"

type GatewayKeyRow = NonNullable<Awaited<ReturnType<typeof findActiveGatewayKey>>>
export type GatewayContext = {
  kind: "gateway"
  organizationId: GatewayKeyRow["organization_id"]
  orgMembershipId: GatewayKeyRow["org_membership_id"]
  gatewayKeyId: GatewayKeyRow["id"]
}

export function gatewayAuth(dependencies: { findActiveGatewayKey: typeof findActiveGatewayKey }) {
  return createMiddleware<InferenceAuthEnv>(async (c, next) => {
    const requestId = buildRequestId()
    c.set("uni-cliRequestId", requestId)
    c.header("x-uni-cli-request-id", requestId)
    let bearer
    try {
      const value = readUni-CLIKey(c.req.raw)
      bearer = value === null ? null : gatewayBearerKey(value)
    } catch {
      return c.json({ error: { code: "invalid_api_key", type: "authentication_error", message: "A valid Uni-CLI Gateway key is required." } }, 401)
    }
    if (!bearer) return c.json({ error: { code: "missing_api_key", type: "authentication_error", message: "Missing Uni-CLI Gateway key." } }, 401)
    const key = await dependencies.findActiveGatewayKey(bearer)
    if (!key) return c.json({ error: { code: "invalid_api_key", type: "authentication_error", message: "Invalid Uni-CLI Gateway key." } }, 401)
    c.set("inference", { kind: "gateway", organizationId: key.organization_id, orgMembershipId: key.org_membership_id, gatewayKeyId: key.id })
    await next()
    c.res.headers.set("x-uni-cli-request-id", requestId)
  })
}
