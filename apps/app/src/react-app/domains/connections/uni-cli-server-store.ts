import { useSyncExternalStore } from "react";

import { t } from "../../../i18n";
import type { StartupPreference, WorkspaceDisplay } from "../../../app/types";
import { isDesktopRuntime } from "../../../app/utils";
import {
  uni-cliServerInfo,
  uni-cliServerRestart,
  type uni-cliServerInfo,
} from "../../../app/lib/desktop";
import {
  getuni-cliGatewayOrigin,
  readuni-cliGatewayDenToken,
} from "../../../app/lib/gateway-runtime";
import {
  clearuni-cliServerSettings,
  createuni-cliServerClient,
  isLoopbackuni-cliServerUrl,
  normalizeuni-cliServerUrl,
  readuni-cliServerSettings,
  writeuni-cliServerSettings,
  type uni-cliAuditEntry,
  type uni-cliServerCapabilities,
  type uni-cliServerClient,
  type uni-cliServerDiagnostics,
  type uni-cliServerError,
  type uni-cliServerSettings,
  type uni-cliServerStatus,
} from "../../../app/lib/uni-cli-server";

type SetStateAction<T> = T | ((current: T) => T);

type RemoteWorkspaceInput = {
  uni-cliHostUrl: string;
  uni-cliToken?: string | null;
  directory?: string | null;
  displayName?: string | null;
};

export type uni-cliServerStoreSnapshot = {
  uni-cliServerSettings: uni-cliServerSettings;
  shareRemoteAccessBusy: boolean;
  shareRemoteAccessError: string | null;
  uni-cliServerUrl: string;
  uni-cliServerBaseUrl: string;
  uni-cliServerAuth: { token?: string; hostToken?: string };
  uni-cliServerClient: uni-cliServerClient | null;
  uni-cliServerStatus: uni-cliServerStatus;
  uni-cliServerCapabilities: uni-cliServerCapabilities | null;
  uni-cliServerReady: boolean;
  uni-cliServerWorkspaceReady: boolean;
  resolveduni-cliCapabilities: uni-cliServerCapabilities | null;
  uni-cliServerCanWriteSkills: boolean;
  uni-cliServerCanWritePlugins: boolean;
  uni-cliServerHostInfo: uni-cliServerInfo | null;
  uni-cliServerDiagnostics: uni-cliServerDiagnostics | null;
  uni-cliReconnectBusy: boolean;
  uni-cliAuditEntries: uni-cliAuditEntry[];
  uni-cliAuditStatus: "idle" | "loading" | "error";
  uni-cliAuditError: string | null;
  devtoolsWorkspaceId: string | null;
};

export type uni-cliServerStore = ReturnType<typeof createuni-cliServerStore>;

type Createuni-cliServerStoreOptions = {
  startupPreference: () => StartupPreference | null;
  documentVisible: () => boolean;
  developerMode: () => boolean;
  runtimeWorkspaceId: () => string | null;
  activeClient: () => unknown | null;
  selectedWorkspaceDisplay: () => WorkspaceDisplay;
  restartLocalServer: () => Promise<boolean>;
  createRemoteWorkspaceFlow: (input: RemoteWorkspaceInput) => Promise<boolean>;
};

type MutableState = {
  uni-cliServerSettings: uni-cliServerSettings;
  shareRemoteAccessBusy: boolean;
  shareRemoteAccessError: string | null;
  uni-cliServerUrl: string;
  uni-cliServerStatus: uni-cliServerStatus;
  uni-cliServerCapabilities: uni-cliServerCapabilities | null;
  uni-cliServerCheckedAt: number | null;
  uni-cliServerHostInfo: uni-cliServerInfo | null;
  uni-cliServerHostInfoReady: boolean;
  uni-cliServerDiagnostics: uni-cliServerDiagnostics | null;
  uni-cliReconnectBusy: boolean;
  uni-cliAuditEntries: uni-cliAuditEntry[];
  uni-cliAuditStatus: "idle" | "loading" | "error";
  uni-cliAuditError: string | null;
  devtoolsWorkspaceId: string | null;
};

const applyStateAction = <T,>(current: T, next: SetStateAction<T>) =>
  typeof next === "function" ? (next as (value: T) => T)(current) : next;

function sameuni-cliServerSnapshot(
  current: uni-cliServerStoreSnapshot,
  next: uni-cliServerStoreSnapshot,
): boolean {
  return (
    current.uni-cliServerSettings === next.uni-cliServerSettings &&
    current.shareRemoteAccessBusy === next.shareRemoteAccessBusy &&
    current.shareRemoteAccessError === next.shareRemoteAccessError &&
    current.uni-cliServerUrl === next.uni-cliServerUrl &&
    current.uni-cliServerBaseUrl === next.uni-cliServerBaseUrl &&
    current.uni-cliServerAuth.token === next.uni-cliServerAuth.token &&
    current.uni-cliServerAuth.hostToken === next.uni-cliServerAuth.hostToken &&
    current.uni-cliServerClient === next.uni-cliServerClient &&
    current.uni-cliServerStatus === next.uni-cliServerStatus &&
    current.uni-cliServerCapabilities === next.uni-cliServerCapabilities &&
    current.uni-cliServerReady === next.uni-cliServerReady &&
    current.uni-cliServerWorkspaceReady === next.uni-cliServerWorkspaceReady &&
    current.resolveduni-cliCapabilities === next.resolveduni-cliCapabilities &&
    current.uni-cliServerCanWriteSkills === next.uni-cliServerCanWriteSkills &&
    current.uni-cliServerCanWritePlugins === next.uni-cliServerCanWritePlugins &&
    current.uni-cliServerHostInfo === next.uni-cliServerHostInfo &&
    current.uni-cliServerDiagnostics === next.uni-cliServerDiagnostics &&
    current.uni-cliReconnectBusy === next.uni-cliReconnectBusy &&
    current.uni-cliAuditEntries === next.uni-cliAuditEntries &&
    current.uni-cliAuditStatus === next.uni-cliAuditStatus &&
    current.uni-cliAuditError === next.uni-cliAuditError &&
    current.devtoolsWorkspaceId === next.devtoolsWorkspaceId
  );
}

export function createuni-cliServerStore(options: Createuni-cliServerStoreOptions) {
  const bootStartedAt = Date.now();
  const listeners = new Set<() => void>();
  const intervals = new Map<string, number>();

  let clientCacheKey = "";
  let clientCacheValue: uni-cliServerClient | null = null;
  let started = false;
  let disposed = false;
  let healthTimeoutId: number | null = null;
  let healthBusy = false;
  let healthDelayMs = 10_000;
  let consecutiveHealthFailures = 0;
  let visibilityChangeHandler: (() => void) | null = null;
  let snapshot: uni-cliServerStoreSnapshot | undefined;

  let state: MutableState = {
    uni-cliServerSettings: readuni-cliServerSettings(),
    shareRemoteAccessBusy: false,
    shareRemoteAccessError: null,
    uni-cliServerUrl: "",
    uni-cliServerStatus: "disconnected",
    uni-cliServerCapabilities: null,
    uni-cliServerCheckedAt: null,
    uni-cliServerHostInfo: null,
    uni-cliServerHostInfoReady: !isDesktopRuntime(),
    uni-cliServerDiagnostics: null,
    uni-cliReconnectBusy: false,
    uni-cliAuditEntries: [],
    uni-cliAuditStatus: "idle",
    uni-cliAuditError: null,
    devtoolsWorkspaceId: null,
  };

  const emitChange = () => {
    for (const listener of listeners) listener();
  };

  const getBaseUrl = () => {
    const gatewayOrigin = getuni-cliGatewayOrigin();
    if (gatewayOrigin) return normalizeuni-cliServerUrl(gatewayOrigin) ?? "";

    const pref = options.startupPreference();
    const hostInfo = state.uni-cliServerHostInfo;
    const settingsUrl = normalizeuni-cliServerUrl(state.uni-cliServerSettings.urlOverride ?? "") ?? "";

    if (pref === "local") return hostInfo?.baseUrl ?? "";
    if (pref === "server" && settingsUrl && isLoopbackuni-cliServerUrl(settingsUrl) && hostInfo?.baseUrl) {
      return hostInfo.baseUrl;
    }
    if (pref === "server") return settingsUrl;
    return hostInfo?.baseUrl ?? settingsUrl;
  };

  const getAuth = () => {
    const gatewayOrigin = getuni-cliGatewayOrigin();
    if (gatewayOrigin) {
      const token = readuni-cliGatewayDenToken().trim();
      return { token: token || undefined, hostToken: undefined };
    }

    const pref = options.startupPreference();
    const hostInfo = state.uni-cliServerHostInfo;
    const settingsUrl = normalizeuni-cliServerUrl(state.uni-cliServerSettings.urlOverride ?? "") ?? "";
    const settingsToken = state.uni-cliServerSettings.token?.trim() ?? "";
    const settingsHostToken = state.uni-cliServerSettings.hostToken?.trim() ?? "";
    const clientToken = hostInfo?.clientToken?.trim() ?? "";
    const hostToken = hostInfo?.hostToken?.trim() ?? "";

    if (pref === "local") {
      return { token: clientToken || undefined, hostToken: hostToken || undefined };
    }
    if (pref === "server" && settingsUrl && isLoopbackuni-cliServerUrl(settingsUrl) && hostInfo?.baseUrl) {
      return {
        token: clientToken || settingsToken || undefined,
        hostToken: hostToken || settingsHostToken || undefined,
      };
    }
    if (pref === "server") {
      return {
        token: settingsToken || undefined,
        hostToken: settingsUrl && isLoopbackuni-cliServerUrl(settingsUrl) ? settingsHostToken || undefined : undefined,
      };
    }
    if (hostInfo?.baseUrl) {
      return { token: clientToken || undefined, hostToken: hostToken || undefined };
    }
    return {
      token: settingsToken || undefined,
      hostToken: settingsUrl && isLoopbackuni-cliServerUrl(settingsUrl) ? settingsHostToken || undefined : undefined,
    };
  };

  const getClient = () => {
    const baseUrl = getBaseUrl().trim();
    if (!baseUrl) {
      clientCacheKey = "";
      clientCacheValue = null;
      return null;
    }

    const auth = getAuth();
    const key = `${baseUrl}::${auth.token ?? ""}::${auth.hostToken ?? ""}`;
    if (key !== clientCacheKey) {
      clientCacheKey = key;
      clientCacheValue = createuni-cliServerClient({
        baseUrl,
        token: auth.token,
        hostToken: auth.hostToken,
      });
    }
    return clientCacheValue;
  };

  const refreshSnapshot = (): boolean => {
    const uni-cliServerBaseUrl = getBaseUrl().trim();
    const uni-cliServerAuth = getAuth();
    const uni-cliServerClient = getClient();
    const uni-cliServerReady = state.uni-cliServerStatus === "connected";
    const uni-cliServerWorkspaceReady = Boolean(options.runtimeWorkspaceId());
    const resolveduni-cliCapabilities = state.uni-cliServerCapabilities;

    const pref = options.startupPreference();
    const info = state.uni-cliServerHostInfo;
    const hostUrl = info?.connectUrl ?? info?.lanUrl ?? info?.mdnsUrl ?? info?.baseUrl ?? "";
    const settingsUrl = normalizeuni-cliServerUrl(state.uni-cliServerSettings.urlOverride ?? "") ?? "";

    let uni-cliServerUrl = hostUrl || settingsUrl;
    if (pref === "local") uni-cliServerUrl = hostUrl;
    if (pref === "server") uni-cliServerUrl = settingsUrl;
    state.uni-cliServerUrl = uni-cliServerUrl;

    const nextSnapshot: uni-cliServerStoreSnapshot = {
      uni-cliServerSettings: state.uni-cliServerSettings,
      shareRemoteAccessBusy: state.shareRemoteAccessBusy,
      shareRemoteAccessError: state.shareRemoteAccessError,
      uni-cliServerUrl,
      uni-cliServerBaseUrl,
      uni-cliServerAuth,
      uni-cliServerClient,
      uni-cliServerStatus: state.uni-cliServerStatus,
      uni-cliServerCapabilities: state.uni-cliServerCapabilities,
      uni-cliServerReady,
      uni-cliServerWorkspaceReady,
      resolveduni-cliCapabilities,
      uni-cliServerCanWriteSkills:
        uni-cliServerReady &&
        (resolveduni-cliCapabilities?.skills?.write ?? false),
      uni-cliServerCanWritePlugins:
        uni-cliServerReady &&
        (resolveduni-cliCapabilities?.plugins?.write ?? false),
      uni-cliServerHostInfo: state.uni-cliServerHostInfo,
      uni-cliServerDiagnostics: state.uni-cliServerDiagnostics,
      uni-cliReconnectBusy: state.uni-cliReconnectBusy,
      uni-cliAuditEntries: state.uni-cliAuditEntries,
      uni-cliAuditStatus: state.uni-cliAuditStatus,
      uni-cliAuditError: state.uni-cliAuditError,
      devtoolsWorkspaceId: state.devtoolsWorkspaceId,
    };
    if (snapshot && sameuni-cliServerSnapshot(snapshot, nextSnapshot)) return false;
    snapshot = nextSnapshot;
    return true;
  };

  const mutateState = (updater: (current: MutableState) => MutableState) => {
    state = updater(state);
    if (refreshSnapshot()) emitChange();
  };

  const setStateField = <K extends keyof MutableState>(key: K, value: MutableState[K]) => {
    if (Object.is(state[key], value)) return;
    mutateState((current) => ({ ...current, [key]: value }));
  };

  const setuni-cliServerSettings = (next: SetStateAction<uni-cliServerSettings>) => {
    const resolved = applyStateAction(state.uni-cliServerSettings, next);
    mutateState((current) => ({ ...current, uni-cliServerSettings: resolved }));
    queueHealthCheck(0);
  };

  const updateuni-cliServerSettings = (next: uni-cliServerSettings) => {
    const stored = writeuni-cliServerSettings(next);
    mutateState((current) => ({ ...current, uni-cliServerSettings: stored }));
    queueHealthCheck(0);
  };

  const resetuni-cliServerSettings = () => {
    clearuni-cliServerSettings();
    mutateState((current) => ({ ...current, uni-cliServerSettings: {} }));
    queueHealthCheck(0);
  };

  const shouldWaitForLocalHostInfo = () =>
    isDesktopRuntime() &&
    options.startupPreference() !== "server" &&
    !state.uni-cliServerHostInfoReady;

  const shouldRetryStartupCheck = (status: uni-cliServerStatus) =>
    status !== "connected" &&
    isDesktopRuntime() &&
    options.startupPreference() !== "server" &&
    Date.now() - bootStartedAt < 5_000;

  const checkuni-cliServer = async (url: string, token?: string, hostToken?: string) => {
    const client = createuni-cliServerClient({ baseUrl: url, token, hostToken });
    try {
      await client.health();
    } catch (error) {
      const resolved = error as uni-cliServerError | Error;
      if ("status" in resolved && (resolved.status === 401 || resolved.status === 403)) {
        return { status: "limited" as uni-cliServerStatus, capabilities: null };
      }
      return { status: "disconnected" as uni-cliServerStatus, capabilities: null };
    }

    if (!token) {
      return { status: "limited" as uni-cliServerStatus, capabilities: null };
    }

    try {
      const capabilities = await client.capabilities();
      return { status: "connected" as uni-cliServerStatus, capabilities };
    } catch (error) {
      const resolved = error as uni-cliServerError | Error;
      if ("status" in resolved && (resolved.status === 401 || resolved.status === 403)) {
        return { status: "limited" as uni-cliServerStatus, capabilities: null };
      }
      return { status: "disconnected" as uni-cliServerStatus, capabilities: null };
    }
  };

  const clearHealthTimeout = () => {
    if (healthTimeoutId !== null) {
      window.clearTimeout(healthTimeoutId);
      healthTimeoutId = null;
    }
  };

  const queueHealthCheck = (delayMs: number) => {
    if (disposed || typeof window === "undefined") return;
    clearHealthTimeout();
    healthTimeoutId = window.setTimeout(() => {
      healthTimeoutId = null;
      void runHealthCheck();
    }, Math.max(0, delayMs));
  };

  const runHealthCheck = async () => {
    if (disposed || typeof window === "undefined") return;
    if (!options.documentVisible()) {
      queueHealthCheck(healthDelayMs);
      return;
    }
    if (shouldWaitForLocalHostInfo()) {
      queueHealthCheck(250);
      return;
    }
    if (healthBusy) return;

    const url = getBaseUrl().trim();
    const auth = getAuth();
    if (!url) {
      consecutiveHealthFailures = 0;
      mutateState((current) => ({
        ...current,
        uni-cliServerStatus: "disconnected",
        uni-cliServerCapabilities: null,
        uni-cliServerCheckedAt: Date.now(),
      }));
      return;
    }

    healthBusy = true;
    try {
      let result = await checkuni-cliServer(url, auth.token, auth.hostToken);

      if (shouldRetryStartupCheck(result.status)) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
        if (disposed) return;

        try {
          const info = await uni-cliServerInfo() as uni-cliServerInfo;
          if (disposed) return;

          mutateState((current) => ({
            ...current,
            uni-cliServerHostInfo: info,
            uni-cliServerHostInfoReady: true,
          }));

          const retryUrl = info.baseUrl?.trim() ?? "";
          const retryToken = info.clientToken?.trim() || undefined;
          const retryHostToken = info.hostToken?.trim() || undefined;
          if (retryUrl) {
            result = await checkuni-cliServer(retryUrl, retryToken, retryHostToken);
          }
        } catch {
          // Preserve the original check result when the retry probe fails.
        }
      }

      if (disposed) return;
      const previousStatus = state.uni-cliServerStatus;
      const previousCapabilities = state.uni-cliServerCapabilities;
      const healthy = result.status === "connected" || result.status === "limited";
      if (healthy) {
        consecutiveHealthFailures = 0;
        healthDelayMs = 10_000;
      } else {
        consecutiveHealthFailures += 1;
        healthDelayMs = Math.min(healthDelayMs * 2, 60_000);
      }

      const preservePrevious =
        !healthy &&
        consecutiveHealthFailures < 3 &&
        (previousStatus === "connected" || previousStatus === "limited");

      mutateState((current) => ({
        ...current,
        uni-cliServerStatus: preservePrevious ? previousStatus : result.status,
        uni-cliServerCapabilities: preservePrevious ? previousCapabilities : result.capabilities,
        uni-cliServerCheckedAt: Date.now(),
      }));
    } catch {
      healthDelayMs = Math.min(healthDelayMs * 2, 60_000);
      mutateState((current) => ({
        ...current,
        uni-cliServerCheckedAt: Date.now(),
      }));
    } finally {
      healthBusy = false;
      if (!disposed) queueHealthCheck(healthDelayMs);
    }
  };

  const syncFromOptions = () => {
    if (refreshSnapshot()) emitChange();

    if (!isDesktopRuntime()) return;
    const port = state.uni-cliServerHostInfo?.port;
    if (!port) return;
    if (state.uni-cliServerSettings.portOverride === port) return;

    updateuni-cliServerSettings({
      ...state.uni-cliServerSettings,
      portOverride: port,
    });
  };

  const startInterval = (key: string, fn: () => void, ms: number) => {
    if (typeof window === "undefined") return;
    if (intervals.has(key)) return;
    intervals.set(key, window.setInterval(fn, ms));
  };

  const stopInterval = (key: string) => {
    const id = intervals.get(key);
    if (id === undefined) return;
    window.clearInterval(id);
    intervals.delete(key);
  };

  const start = () => {
    if (typeof window === "undefined") return;
    if (started) return;
    // Allow restart after a prior dispose() (React 18 StrictMode double-mounts
    // each effect in dev: mount → dispose → re-mount). If we early-return when
    // `disposed` is true, the real mount never arms polling and the UI stays
    // on stale/empty state forever.
    disposed = false;
    started = true;

    syncFromOptions();
    queueHealthCheck(0);
    visibilityChangeHandler = () => {
      if (!options.documentVisible()) return;
      consecutiveHealthFailures = 0;
      queueHealthCheck(0);
    };
    window.addEventListener("visibilitychange", visibilityChangeHandler);

    const refreshHostInfo = () => {
      if (!isDesktopRuntime()) return;
      if (!options.documentVisible()) return;
      void (async () => {
        try {
          const info = await uni-cliServerInfo() as uni-cliServerInfo;
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uni-cliServerHostInfo: info,
            uni-cliServerHostInfoReady: true,
          }));
        } catch {
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uni-cliServerHostInfo: null,
            uni-cliServerHostInfoReady: true,
          }));
        }
      })();
    };
    refreshHostInfo();
    startInterval("hostInfo", refreshHostInfo, 10_000);

    const refreshDiagnostics = () => {
      if (!options.documentVisible()) return;
      if (!options.developerMode()) {
        setStateField("uni-cliServerDiagnostics", null);
        return;
      }

      const client = getClient();
      if (!client || state.uni-cliServerStatus === "disconnected") {
        setStateField("uni-cliServerDiagnostics", null);
        return;
      }

      void (async () => {
        try {
          const status = await client.status();
          if (!disposed) setStateField("uni-cliServerDiagnostics", status);
        } catch {
          if (!disposed) setStateField("uni-cliServerDiagnostics", null);
        }
      })();
    };
    refreshDiagnostics();
    startInterval("diagnostics", refreshDiagnostics, 10_000);

    const refreshDevtoolsWorkspace = () => {
      if (!options.documentVisible()) return;
      if (!options.developerMode()) {
        setStateField("devtoolsWorkspaceId", null);
        return;
      }

      const client = getClient();
      if (!client) {
        setStateField("devtoolsWorkspaceId", null);
        return;
      }

      void (async () => {
        try {
          const response = await client.listWorkspaces();
          if (disposed) return;
          const items = Array.isArray(response.items) ? response.items : [];
          const activeMatch = response.activeId
            ? items.find((item) => item.id === response.activeId)
            : null;
          setStateField("devtoolsWorkspaceId", activeMatch?.id ?? items[0]?.id ?? null);
        } catch {
          if (!disposed) setStateField("devtoolsWorkspaceId", null);
        }
      })();
    };
    refreshDevtoolsWorkspace();
    startInterval("devtoolsWorkspace", refreshDevtoolsWorkspace, 20_000);

    const refreshAudit = () => {
      if (!options.documentVisible()) return;
      if (!options.developerMode()) {
        mutateState((current) => ({
          ...current,
          uni-cliAuditEntries: [],
          uni-cliAuditStatus: "idle",
          uni-cliAuditError: null,
        }));
        return;
      }

      const client = getClient();
      const workspaceId = state.devtoolsWorkspaceId;
      if (!client || !workspaceId) {
        mutateState((current) => ({
          ...current,
          uni-cliAuditEntries: [],
          uni-cliAuditStatus: "idle",
          uni-cliAuditError: null,
        }));
        return;
      }

      mutateState((current) => ({
        ...current,
        uni-cliAuditStatus: "loading",
        uni-cliAuditError: null,
      }));

      void (async () => {
        try {
          const result = await client.listAudit(workspaceId, 50);
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uni-cliAuditEntries: Array.isArray(result.items) ? result.items : [],
            uni-cliAuditStatus: "idle",
          }));
        } catch (error) {
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uni-cliAuditEntries: [],
            uni-cliAuditStatus: "error",
            uni-cliAuditError:
              error instanceof Error
                ? error.message
                : t("app.error_audit_load"),
          }));
        }
      })();
    };
    refreshAudit();
    startInterval("audit", refreshAudit, 15_000);
  };

  const dispose = () => {
    disposed = true;
    started = false;
    clearHealthTimeout();
    if (visibilityChangeHandler && typeof window !== "undefined") {
      window.removeEventListener("visibilitychange", visibilityChangeHandler);
      visibilityChangeHandler = null;
    }
    for (const key of [...intervals.keys()]) stopInterval(key);
  };

  const testuni-cliServerConnection = async (next: uni-cliServerSettings) => {
    const derived = normalizeuni-cliServerUrl(next.urlOverride ?? "");
    if (!derived) {
      mutateState((current) => ({
        ...current,
        uni-cliServerStatus: "disconnected",
        uni-cliServerCapabilities: null,
        uni-cliServerCheckedAt: Date.now(),
      }));
      return false;
    }

    const result = await checkuni-cliServer(derived, next.token);
    consecutiveHealthFailures = result.status === "disconnected" ? consecutiveHealthFailures + 1 : 0;
    mutateState((current) => ({
      ...current,
      uni-cliServerStatus: result.status,
      uni-cliServerCapabilities: result.capabilities,
      uni-cliServerCheckedAt: Date.now(),
    }));

    const ok = result.status === "connected" || result.status === "limited";
    if (ok && !isDesktopRuntime()) {
      const active = options.selectedWorkspaceDisplay();
      const shouldAttach =
        !options.activeClient() ||
        active.workspaceType !== "remote" ||
        active.remoteType !== "uni-cli";
      if (shouldAttach) {
        await options
          .createRemoteWorkspaceFlow({
            uni-cliHostUrl: derived,
            uni-cliToken: next.token ?? null,
          })
          .catch(() => undefined);
      }
    }
    return ok;
  };

  const reconnectuni-cliServer = async () => {
    if (state.uni-cliReconnectBusy) return false;
    setStateField("uni-cliReconnectBusy", true);

    try {
      let hostInfo = state.uni-cliServerHostInfo;
      if (isDesktopRuntime()) {
        try {
          hostInfo = await uni-cliServerInfo() as uni-cliServerInfo;
          mutateState((current) => ({ ...current, uni-cliServerHostInfo: hostInfo }));
        } catch {
          hostInfo = null;
          setStateField("uni-cliServerHostInfo", null);
        }
      }

      if (hostInfo?.clientToken?.trim() && options.startupPreference() !== "server") {
        const liveToken = hostInfo.clientToken.trim();
        const liveHostToken = hostInfo.hostToken?.trim() ?? "";
        const settings = state.uni-cliServerSettings;
        if (
          (settings.token?.trim() ?? "") !== liveToken ||
          (settings.hostToken?.trim() ?? "") !== liveHostToken
        ) {
          updateuni-cliServerSettings({
            ...settings,
            token: liveToken,
            hostToken: liveHostToken || undefined,
          });
        }
      }

      const url = getBaseUrl().trim();
      const auth = getAuth();
      if (!url) {
        mutateState((current) => ({
          ...current,
          uni-cliServerStatus: "disconnected",
          uni-cliServerCapabilities: null,
          uni-cliServerCheckedAt: Date.now(),
        }));
        return false;
      }

      const result = await checkuni-cliServer(url, auth.token, auth.hostToken);
      mutateState((current) => ({
        ...current,
        uni-cliServerStatus: result.status,
        uni-cliServerCapabilities: result.capabilities,
        uni-cliServerCheckedAt: Date.now(),
      }));
      return result.status === "connected" || result.status === "limited";
    } finally {
      setStateField("uni-cliReconnectBusy", false);
    }
  };

  async function ensureLocaluni-cliServerClient(): Promise<uni-cliServerClient | null> {
    const healthyClientFromInfo = async (
      info: uni-cliServerInfo | null,
    ): Promise<uni-cliServerClient | null> => {
      const baseUrl = info?.baseUrl?.trim() ?? "";
      const token = info?.clientToken?.trim() ?? "";
      if (!baseUrl || !token) return null;
      const candidate = createuni-cliServerClient({
        baseUrl,
        token,
        hostToken: info?.hostToken?.trim() || undefined,
      });
      try {
        await candidate.health();
      } catch {
        return null;
      }
      return candidate;
    };

    const cached = await healthyClientFromInfo(state.uni-cliServerHostInfo);
    if (cached) {
      if (options.startupPreference() !== "server") {
        await reconnectuni-cliServer();
      }
      return cached;
    }

    if (!isDesktopRuntime()) return null;

    // A store that has not observed the server yet (a fresh route mount)
    // must not treat it as dead: the restart below tears down the embedded
    // server AND its managed engine, killing every live run. Ask the desktop
    // bridge for the live server first and restart only when that running
    // server is genuinely unreachable.
    let hostInfo: uni-cliServerInfo | null = null;
    try {
      hostInfo = await uni-cliServerInfo() as uni-cliServerInfo;
      mutateState((current) => ({
        ...current,
        uni-cliServerHostInfo: hostInfo,
        uni-cliServerHostInfoReady: true,
      }));
    } catch {
      hostInfo = null;
    }
    const live = await healthyClientFromInfo(hostInfo);
    if (live) {
      if (options.startupPreference() !== "server") {
        await reconnectuni-cliServer();
      }
      return live;
    }

    try {
      hostInfo = await uni-cliServerRestart({
        remoteAccessEnabled: state.uni-cliServerSettings.remoteAccessEnabled === true,
      }) as uni-cliServerInfo;
      mutateState((current) => ({ ...current, uni-cliServerHostInfo: hostInfo }));
    } catch {
      return null;
    }

    const baseUrl = hostInfo?.baseUrl?.trim() ?? "";
    const token = hostInfo?.clientToken?.trim() ?? "";
    const hostToken = hostInfo?.hostToken?.trim() ?? "";
    if (!baseUrl || !token) return null;

    if (options.startupPreference() !== "server") {
      await reconnectuni-cliServer();
    }

    return createuni-cliServerClient({
      baseUrl,
      token,
      hostToken: hostToken || undefined,
    });
  }

  const saveShareRemoteAccess = async (enabled: boolean) => {
    if (state.shareRemoteAccessBusy) return;
    const previous = state.uni-cliServerSettings;
    const next: uni-cliServerSettings = {
      ...previous,
      remoteAccessEnabled: enabled,
    };

    mutateState((current) => ({
      ...current,
      shareRemoteAccessBusy: true,
      shareRemoteAccessError: null,
    }));
    updateuni-cliServerSettings(next);

    try {
      if (isDesktopRuntime() && options.selectedWorkspaceDisplay().workspaceType === "local") {
        const restarted = await options.restartLocalServer();
        if (!restarted) {
          throw new Error(t("app.error_restart_local_worker"));
        }
        await reconnectuni-cliServer();
      }
    } catch (error) {
      updateuni-cliServerSettings(previous);
      mutateState((current) => ({
        ...current,
        shareRemoteAccessError:
          error instanceof Error
            ? error.message
            : t("app.error_remote_access"),
      }));
      return;
    } finally {
      setStateField("shareRemoteAccessBusy", false);
    }
  };

  refreshSnapshot();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = () => {
    if (!snapshot) throw new Error("Uni-CLI server snapshot was not initialized.");
    return snapshot;
  };

  return {
    subscribe,
    getSnapshot,
    start,
    dispose,
    syncFromOptions,
    setuni-cliServerSettings,
    updateuni-cliServerSettings,
    resetuni-cliServerSettings,
    saveShareRemoteAccess,
    checkuni-cliServer,
    testuni-cliServerConnection,
    reconnectuni-cliServer,
    ensureLocaluni-cliServerClient,
  };
}

export function useuni-cliServerStoreSnapshot(store: uni-cliServerStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
