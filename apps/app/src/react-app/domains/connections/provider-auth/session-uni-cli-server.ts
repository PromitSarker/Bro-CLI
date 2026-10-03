// Session-route adapter for the provider-auth store's `uni-cliServer` slice.
//
// The settings route feeds the store the full uni-cli-server store, whose
// snapshot carries the server's real capabilities (including `providerSync`)
// and host-token auth. The session route used to fabricate a snapshot with
// hard-coded `{ config }` capabilities and no auth at all, so on the app's
// default surface `serverHandlesProviderSync()` was permanently false:
// PUT /den-session never fired after sign-in, the local server never learned
// the Den session, and server-side cloud provider sync never started (#3671).
//
// This adapter reports the truth for the endpoint it wraps:
// - loopback local endpoints (the desktop's own Uni-CLI server) advertise
//   `providerSync: true` — every Uni-CLI server does
//   (apps/server/src/types.ts `Capabilities.providerSync: true`) — and carry
//   the live host token so the store can PUT /den-session and
//   POST /cloud-provider-sync/run;
// - remote workspaces and non-loopback local URL overrides stay config-only:
//   a local workspace label does not authorize forwarding desktop credentials.
import {
  createuni-cliServerClient,
  isLoopbackuni-cliServerUrl,
  readuni-cliServerSettings,
  type uni-cliServerClient,
} from "@/app/lib/uni-cli-server";
import type { ResolvedWorkspaceEndpoint } from "@/app/lib/workspace-endpoint";
import type { ProviderAuthuni-cliServer } from "./store";

type Sessionuni-cliServerSnapshot = ReturnType<ProviderAuthuni-cliServer["getSnapshot"]>;

export type CreateSessionuni-cliServerInput = {
  endpoint: () => ResolvedWorkspaceEndpoint | null;
  /** Live host token from the desktop runtime (uni-cliServerInfo). */
  hostToken?: () => string;
  generation?: () => number | null;
};

function resolveHostToken(endpoint: ResolvedWorkspaceEndpoint, live: string): string {
  // Fallback mirrors uni-cli-server-store's getAuth(): persisted settings may
  // hold the host token (ensureDesktopLocaluni-cliConnection writes it), but
  // both live and stored host tokens must stay on loopback servers.
  if (!isLoopbackuni-cliServerUrl(endpoint.baseUrl)) return "";
  if (live) return live;
  return readuni-cliServerSettings().hostToken?.trim() ?? "";
}

export function createSessionuni-cliServer(
  input: CreateSessionuni-cliServerInput,
): ProviderAuthuni-cliServer {
  let clientCacheKey = "";
  let clientCacheValue: uni-cliServerClient | null = null;

  const hostAwareClient = (endpoint: ResolvedWorkspaceEndpoint, hostToken: string): uni-cliServerClient => {
    if (!hostToken) return endpoint.client;
    const key = `${endpoint.baseUrl}\u001f${endpoint.token}\u001f${hostToken}`;
    if (key !== clientCacheKey || !clientCacheValue) {
      clientCacheKey = key;
      clientCacheValue = createuni-cliServerClient({
        baseUrl: endpoint.baseUrl,
        token: endpoint.token || undefined,
        hostToken,
      });
    }
    return clientCacheValue;
  };

  return {
    getSnapshot: (): Sessionuni-cliServerSnapshot => {
      const endpoint = input.endpoint();
      if (!endpoint) {
        return {
          uni-cliServerStatus: "disconnected",
          uni-cliServerClient: null,
          uni-cliServerCapabilities: null,
        };
      }
      if (endpoint.isRemote || !isLoopbackuni-cliServerUrl(endpoint.baseUrl)) {
        return {
          uni-cliServerStatus: "connected",
          uni-cliServerClient: endpoint.client,
          uni-cliServerCapabilities: { config: { read: true, write: true } },
        };
      }
      const hostToken = resolveHostToken(endpoint, input.hostToken?.().trim() ?? "");
      return {
        uni-cliServerStatus: "connected",
        uni-cliServerClient: hostAwareClient(endpoint, hostToken),
        uni-cliServerHostInfo: { generation: input.generation?.() ?? null },
        uni-cliServerAuth: {
          token: endpoint.token || undefined,
          hostToken: hostToken || undefined,
        },
        uni-cliServerCapabilities: {
          config: { read: true, write: true },
          providerSync: true,
        },
      };
    },
  };
}
