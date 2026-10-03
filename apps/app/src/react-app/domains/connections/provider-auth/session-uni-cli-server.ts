// Session-route adapter for the provider-auth store's `uniCliServer` slice.
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
  createuniCliServerClient,
  isLoopbackuniCliServerUrl,
  readuniCliServerSettings,
  type uniCliServerClient,
} from "@/app/lib/uni-cli-server";
import type { ResolvedWorkspaceEndpoint } from "@/app/lib/workspace-endpoint";
import type { ProviderAuthuniCliServer } from "./store";

type SessionuniCliServerSnapshot = ReturnType<ProviderAuthuniCliServer["getSnapshot"]>;

export type CreateSessionuniCliServerInput = {
  endpoint: () => ResolvedWorkspaceEndpoint | null;
  /** Live host token from the desktop runtime (uniCliServerInfo). */
  hostToken?: () => string;
  generation?: () => number | null;
};

function resolveHostToken(endpoint: ResolvedWorkspaceEndpoint, live: string): string {
  // Fallback mirrors uni-cli-server-store's getAuth(): persisted settings may
  // hold the host token (ensureDesktopLocaluniCliConnection writes it), but
  // both live and stored host tokens must stay on loopback servers.
  if (!isLoopbackuniCliServerUrl(endpoint.baseUrl)) return "";
  if (live) return live;
  return readuniCliServerSettings().hostToken?.trim() ?? "";
}

export function createSessionuniCliServer(
  input: CreateSessionuniCliServerInput,
): ProviderAuthuniCliServer {
  let clientCacheKey = "";
  let clientCacheValue: uniCliServerClient | null = null;

  const hostAwareClient = (endpoint: ResolvedWorkspaceEndpoint, hostToken: string): uniCliServerClient => {
    if (!hostToken) return endpoint.client;
    const key = `${endpoint.baseUrl}\u001f${endpoint.token}\u001f${hostToken}`;
    if (key !== clientCacheKey || !clientCacheValue) {
      clientCacheKey = key;
      clientCacheValue = createuniCliServerClient({
        baseUrl: endpoint.baseUrl,
        token: endpoint.token || undefined,
        hostToken,
      });
    }
    return clientCacheValue;
  };

  return {
    getSnapshot: (): SessionuniCliServerSnapshot => {
      const endpoint = input.endpoint();
      if (!endpoint) {
        return {
          uniCliServerStatus: "disconnected",
          uniCliServerClient: null,
          uniCliServerCapabilities: null,
        };
      }
      if (endpoint.isRemote || !isLoopbackuniCliServerUrl(endpoint.baseUrl)) {
        return {
          uniCliServerStatus: "connected",
          uniCliServerClient: endpoint.client,
          uniCliServerCapabilities: { config: { read: true, write: true } },
        };
      }
      const hostToken = resolveHostToken(endpoint, input.hostToken?.().trim() ?? "");
      return {
        uniCliServerStatus: "connected",
        uniCliServerClient: hostAwareClient(endpoint, hostToken),
        uniCliServerHostInfo: { generation: input.generation?.() ?? null },
        uniCliServerAuth: {
          token: endpoint.token || undefined,
          hostToken: hostToken || undefined,
        },
        uniCliServerCapabilities: {
          config: { read: true, write: true },
          providerSync: true,
        },
      };
    },
  };
}
