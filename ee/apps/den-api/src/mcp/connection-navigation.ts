import { env } from "../env.js"

export function uni-cliYourConnectionsUrl(connectionId: string) {
  const url = new URL("/dashboard/your-connections", env.betterAuthUrl)
  url.searchParams.set("connectionId", connectionId)
  return url.toString()
}

export function uni-cliOrganizationConnectionsUrl() {
  return new URL("/dashboard/mcp-connections", env.betterAuthUrl).toString()
}
