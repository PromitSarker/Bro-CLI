import { env } from "../env.js"

export function uniCliYourConnectionsUrl(connectionId: string) {
  const url = new URL("/dashboard/your-connections", env.betterAuthUrl)
  url.searchParams.set("connectionId", connectionId)
  return url.toString()
}

export function uniCliOrganizationConnectionsUrl() {
  return new URL("/dashboard/mcp-connections", env.betterAuthUrl).toString()
}
