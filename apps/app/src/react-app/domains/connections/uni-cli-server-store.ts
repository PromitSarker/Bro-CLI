import { useSyncExternalStore } from "react";

import { t } from "../../../i18n";
import type { StartupPreference, WorkspaceDisplay } from "../../../app/types";
import { isDesktopRuntime } from "../../../app/utils";
import {
  uniCliServerInfo,
  uniCliServerRestart,
  type uniCliServerInfo,
} from "../../../app/lib/desktop";
import {
  getuniCliGatewayOrigin,
  readuniCliGatewayDenToken,
} from "../../../app/lib/gateway-runtime";
import {
  clearuniCliServerSettings,
  createuniCliServerClient,
  isLoopbackuniCliServerUrl,
  normalizeuniCliServerUrl,
  readuniCliServerSettings,
  writeuniCliServerSettings,
  type uniCliAuditEntry,
  type uniCliServerCapabilities,
  type uniCliServerClient,
  type uniCliServerDiagnostics,
  type uniCliServerError,
  type uniCliServerSettings,
  type uniCliServerStatus,
} from "../../../app/lib/uni-cli-server";

type SetStateAction<T> = T | ((current: T) => T);

type RemoteWorkspaceInput = {
  uniCliHostUrl: string;
  uniCliToken?: string | null;
  directory?: string | null;
  displayName?: string | null;
};

export type uniCliServerStoreSnapshot = {
  uniCliServerSettings: uniCliServerSettings;
  shareRemoteAccessBusy: boolean;
  shareRemoteAccessError: string | null;
  uniCliServerUrl: string;
  uniCliServerBaseUrl: string;
  uniCliServerAuth: { token?: string; hostToken?: string };
  uniCliServerClient: uniCliServerClient | null;
  uniCliServerStatus: uniCliServerStatus;
  uniCliServerCapabilities: uniCliServerCapabilities | null;
  uniCliServerReady: boolean;
  uniCliServerWorkspaceReady: boolean;
  resolveduniCliCapabilities: uniCliServerCapabilities | null;
  uniCliServerCanWriteSkills: boolean;
  uniCliServerCanWritePlugins: boolean;
  uniCliServerHostInfo: uniCliServerInfo | null;
  uniCliServerDiagnostics: uniCliServerDiagnostics | null;
  uniCliReconnectBusy: boolean;
  uniCliAuditEntries: uniCliAuditEntry[];
  uniCliAuditStatus: "idle" | "loading" | "error";
  uniCliAuditError: string | null;
  devtoolsWorkspaceId: string | null;
};

export type uniCliServerStore = ReturnType<typeof createuniCliServerStore>;

type CreateuniCliServerStoreOptions = {
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
  uniCliServerSettings: uniCliServerSettings;
  shareRemoteAccessBusy: boolean;
  shareRemoteAccessError: string | null;
  uniCliServerUrl: string;
  uniCliServerStatus: uniCliServerStatus;
  uniCliServerCapabilities: uniCliServerCapabilities | null;
  uniCliServerCheckedAt: number | null;
  uniCliServerHostInfo: uniCliServerInfo | null;
  uniCliServerHostInfoReady: boolean;
  uniCliServerDiagnostics: uniCliServerDiagnostics | null;
  uniCliReconnectBusy: boolean;
  uniCliAuditEntries: uniCliAuditEntry[];
  uniCliAuditStatus: "idle" | "loading" | "error";
  uniCliAuditError: string | null;
  devtoolsWorkspaceId: string | null;
};

const applyStateAction = <T,>(current: T, next: SetStateAction<T>) =>
  typeof next === "function" ? (next as (value: T) => T)(current) : next;

function sameuniCliServerSnapshot(
  current: uniCliServerStoreSnapshot,
  next: uniCliServerStoreSnapshot,
): boolean {
  return (
    current.uniCliServerSettings === next.uniCliServerSettings &&
    current.shareRemoteAccessBusy === next.shareRemoteAccessBusy &&
    current.shareRemoteAccessError === next.shareRemoteAccessError &&
    current.uniCliServerUrl === next.uniCliServerUrl &&
    current.uniCliServerBaseUrl === next.uniCliServerBaseUrl &&
    current.uniCliServerAuth.token === next.uniCliServerAuth.token &&
    current.uniCliServerAuth.hostToken === next.uniCliServerAuth.hostToken &&
    current.uniCliServerClient === next.uniCliServerClient &&
    current.uniCliServerStatus === next.uniCliServerStatus &&
    current.uniCliServerCapabilities === next.uniCliServerCapabilities &&
    current.uniCliServerReady === next.uniCliServerReady &&
    current.uniCliServerWorkspaceReady === next.uniCliServerWorkspaceReady &&
    current.resolveduniCliCapabilities === next.resolveduniCliCapabilities &&
    current.uniCliServerCanWriteSkills === next.uniCliServerCanWriteSkills &&
    current.uniCliServerCanWritePlugins === next.uniCliServerCanWritePlugins &&
    current.uniCliServerHostInfo === next.uniCliServerHostInfo &&
    current.uniCliServerDiagnostics === next.uniCliServerDiagnostics &&
    current.uniCliReconnectBusy === next.uniCliReconnectBusy &&
    current.uniCliAuditEntries === next.uniCliAuditEntries &&
    current.uniCliAuditStatus === next.uniCliAuditStatus &&
    current.uniCliAuditError === next.uniCliAuditError &&
    current.devtoolsWorkspaceId === next.devtoolsWorkspaceId
  );
}

export function createuniCliServerStore(options: CreateuniCliServerStoreOptions) {
  const bootStartedAt = Date.now();
  const listeners = new Set<() => void>();
  const intervals = new Map<string, number>();

  let clientCacheKey = "";
  let clientCacheValue: uniCliServerClient | null = null;
  let started = false;
  let disposed = false;
  let healthTimeoutId: number | null = null;
  let healthBusy = false;
  let healthDelayMs = 10_000;
  let consecutiveHealthFailures = 0;
  let visibilityChangeHandler: (() => void) | null = null;
  let snapshot: uniCliServerStoreSnapshot | undefined;

  let state: MutableState = {
    uniCliServerSettings: readuniCliServerSettings(),
    shareRemoteAccessBusy: false,
    shareRemoteAccessError: null,
    uniCliServerUrl: "",
    uniCliServerStatus: "disconnected",
    uniCliServerCapabilities: null,
    uniCliServerCheckedAt: null,
    uniCliServerHostInfo: null,
    uniCliServerHostInfoReady: !isDesktopRuntime(),
    uniCliServerDiagnostics: null,
    uniCliReconnectBusy: false,
    uniCliAuditEntries: [],
    uniCliAuditStatus: "idle",
    uniCliAuditError: null,
    devtoolsWorkspaceId: null,
  };

  const emitChange = () => {
    for (const listener of listeners) listener();
  };

  const getBaseUrl = () => {
    const gatewayOrigin = getuniCliGatewayOrigin();
    if (gatewayOrigin) return normalizeuniCliServerUrl(gatewayOrigin) ?? "";

    const pref = options.startupPreference();
    const hostInfo = state.uniCliServerHostInfo;
    const settingsUrl = normalizeuniCliServerUrl(state.uniCliServerSettings.urlOverride ?? "") ?? "";

    if (pref === "local") return hostInfo?.baseUrl ?? "";
    if (pref === "server" && settingsUrl && isLoopbackuniCliServerUrl(settingsUrl) && hostInfo?.baseUrl) {
      return hostInfo.baseUrl;
    }
    if (pref === "server") return settingsUrl;
    return hostInfo?.baseUrl ?? settingsUrl;
  };

  const getAuth = () => {
    const gatewayOrigin = getuniCliGatewayOrigin();
    if (gatewayOrigin) {
      const token = readuniCliGatewayDenToken().trim();
      return { token: token || undefined, hostToken: undefined };
    }

    const pref = options.startupPreference();
    const hostInfo = state.uniCliServerHostInfo;
    const settingsUrl = normalizeuniCliServerUrl(state.uniCliServerSettings.urlOverride ?? "") ?? "";
    const settingsToken = state.uniCliServerSettings.token?.trim() ?? "";
    const settingsHostToken = state.uniCliServerSettings.hostToken?.trim() ?? "";
    const clientToken = hostInfo?.clientToken?.trim() ?? "";
    const hostToken = hostInfo?.hostToken?.trim() ?? "";

    if (pref === "local") {
      return { token: clientToken || undefined, hostToken: hostToken || undefined };
    }
    if (pref === "server" && settingsUrl && isLoopbackuniCliServerUrl(settingsUrl) && hostInfo?.baseUrl) {
      return {
        token: clientToken || settingsToken || undefined,
        hostToken: hostToken || settingsHostToken || undefined,
      };
    }
    if (pref === "server") {
      return {
        token: settingsToken || undefined,
        hostToken: settingsUrl && isLoopbackuniCliServerUrl(settingsUrl) ? settingsHostToken || undefined : undefined,
      };
    }
    if (hostInfo?.baseUrl) {
      return { token: clientToken || undefined, hostToken: hostToken || undefined };
    }
    return {
      token: settingsToken || undefined,
      hostToken: settingsUrl && isLoopbackuniCliServerUrl(settingsUrl) ? settingsHostToken || undefined : undefined,
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
      clientCacheValue = createuniCliServerClient({
        baseUrl,
        token: auth.token,
        hostToken: auth.hostToken,
      });
    }
    return clientCacheValue;
  };

  const refreshSnapshot = (): boolean => {
    const uniCliServerBaseUrl = getBaseUrl().trim();
    const uniCliServerAuth = getAuth();
    const uniCliServerClient = getClient();
    const uniCliServerReady = state.uniCliServerStatus === "connected";
    const uniCliServerWorkspaceReady = Boolean(options.runtimeWorkspaceId());
    const resolveduniCliCapabilities = state.uniCliServerCapabilities;

    const pref = options.startupPreference();
    const info = state.uniCliServerHostInfo;
    const hostUrl = info?.connectUrl ?? info?.lanUrl ?? info?.mdnsUrl ?? info?.baseUrl ?? "";
    const settingsUrl = normalizeuniCliServerUrl(state.uniCliServerSettings.urlOverride ?? "") ?? "";

    let uniCliServerUrl = hostUrl || settingsUrl;
    if (pref === "local") uniCliServerUrl = hostUrl;
    if (pref === "server") uniCliServerUrl = settingsUrl;
    state.uniCliServerUrl = uniCliServerUrl;

    const nextSnapshot: uniCliServerStoreSnapshot = {
      uniCliServerSettings: state.uniCliServerSettings,
      shareRemoteAccessBusy: state.shareRemoteAccessBusy,
      shareRemoteAccessError: state.shareRemoteAccessError,
      uniCliServerUrl,
      uniCliServerBaseUrl,
      uniCliServerAuth,
      uniCliServerClient,
      uniCliServerStatus: state.uniCliServerStatus,
      uniCliServerCapabilities: state.uniCliServerCapabilities,
      uniCliServerReady,
      uniCliServerWorkspaceReady,
      resolveduniCliCapabilities,
      uniCliServerCanWriteSkills:
        uniCliServerReady &&
        (resolveduniCliCapabilities?.skills?.write ?? false),
      uniCliServerCanWritePlugins:
        uniCliServerReady &&
        (resolveduniCliCapabilities?.plugins?.write ?? false),
      uniCliServerHostInfo: state.uniCliServerHostInfo,
      uniCliServerDiagnostics: state.uniCliServerDiagnostics,
      uniCliReconnectBusy: state.uniCliReconnectBusy,
      uniCliAuditEntries: state.uniCliAuditEntries,
      uniCliAuditStatus: state.uniCliAuditStatus,
      uniCliAuditError: state.uniCliAuditError,
      devtoolsWorkspaceId: state.devtoolsWorkspaceId,
    };
    if (snapshot && sameuniCliServerSnapshot(snapshot, nextSnapshot)) return false;
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

  const setuniCliServerSettings = (next: SetStateAction<uniCliServerSettings>) => {
    const resolved = applyStateAction(state.uniCliServerSettings, next);
    mutateState((current) => ({ ...current, uniCliServerSettings: resolved }));
    queueHealthCheck(0);
  };

  const updateuniCliServerSettings = (next: uniCliServerSettings) => {
    const stored = writeuniCliServerSettings(next);
    mutateState((current) => ({ ...current, uniCliServerSettings: stored }));
    queueHealthCheck(0);
  };

  const resetuniCliServerSettings = () => {
    clearuniCliServerSettings();
    mutateState((current) => ({ ...current, uniCliServerSettings: {} }));
    queueHealthCheck(0);
  };

  const shouldWaitForLocalHostInfo = () =>
    isDesktopRuntime() &&
    options.startupPreference() !== "server" &&
    !state.uniCliServerHostInfoReady;

  const shouldRetryStartupCheck = (status: uniCliServerStatus) =>
    status !== "connected" &&
    isDesktopRuntime() &&
    options.startupPreference() !== "server" &&
    Date.now() - bootStartedAt < 5_000;

  const checkuniCliServer = async (url: string, token?: string, hostToken?: string) => {
    const client = createuniCliServerClient({ baseUrl: url, token, hostToken });
    try {
      await client.health();
    } catch (error) {
      const resolved = error as uniCliServerError | Error;
      if ("status" in resolved && (resolved.status === 401 || resolved.status === 403)) {
        return { status: "limited" as uniCliServerStatus, capabilities: null };
      }
      return { status: "disconnected" as uniCliServerStatus, capabilities: null };
    }

    if (!token) {
      return { status: "limited" as uniCliServerStatus, capabilities: null };
    }

    try {
      const capabilities = await client.capabilities();
      return { status: "connected" as uniCliServerStatus, capabilities };
    } catch (error) {
      const resolved = error as uniCliServerError | Error;
      if ("status" in resolved && (resolved.status === 401 || resolved.status === 403)) {
        return { status: "limited" as uniCliServerStatus, capabilities: null };
      }
      return { status: "disconnected" as uniCliServerStatus, capabilities: null };
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
        uniCliServerStatus: "disconnected",
        uniCliServerCapabilities: null,
        uniCliServerCheckedAt: Date.now(),
      }));
      return;
    }

    healthBusy = true;
    try {
      let result = await checkuniCliServer(url, auth.token, auth.hostToken);

      if (shouldRetryStartupCheck(result.status)) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
        if (disposed) return;

        try {
          const info = await uniCliServerInfo() as uniCliServerInfo;
          if (disposed) return;

          mutateState((current) => ({
            ...current,
            uniCliServerHostInfo: info,
            uniCliServerHostInfoReady: true,
          }));

          const retryUrl = info.baseUrl?.trim() ?? "";
          const retryToken = info.clientToken?.trim() || undefined;
          const retryHostToken = info.hostToken?.trim() || undefined;
          if (retryUrl) {
            result = await checkuniCliServer(retryUrl, retryToken, retryHostToken);
          }
        } catch {
          // Preserve the original check result when the retry probe fails.
        }
      }

      if (disposed) return;
      const previousStatus = state.uniCliServerStatus;
      const previousCapabilities = state.uniCliServerCapabilities;
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
        uniCliServerStatus: preservePrevious ? previousStatus : result.status,
        uniCliServerCapabilities: preservePrevious ? previousCapabilities : result.capabilities,
        uniCliServerCheckedAt: Date.now(),
      }));
    } catch {
      healthDelayMs = Math.min(healthDelayMs * 2, 60_000);
      mutateState((current) => ({
        ...current,
        uniCliServerCheckedAt: Date.now(),
      }));
    } finally {
      healthBusy = false;
      if (!disposed) queueHealthCheck(healthDelayMs);
    }
  };

  const syncFromOptions = () => {
    if (refreshSnapshot()) emitChange();

    if (!isDesktopRuntime()) return;
    const port = state.uniCliServerHostInfo?.port;
    if (!port) return;
    if (state.uniCliServerSettings.portOverride === port) return;

    updateuniCliServerSettings({
      ...state.uniCliServerSettings,
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
          const info = await uniCliServerInfo() as uniCliServerInfo;
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uniCliServerHostInfo: info,
            uniCliServerHostInfoReady: true,
          }));
        } catch {
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uniCliServerHostInfo: null,
            uniCliServerHostInfoReady: true,
          }));
        }
      })();
    };
    refreshHostInfo();
    startInterval("hostInfo", refreshHostInfo, 10_000);

    const refreshDiagnostics = () => {
      if (!options.documentVisible()) return;
      if (!options.developerMode()) {
        setStateField("uniCliServerDiagnostics", null);
        return;
      }

      const client = getClient();
      if (!client || state.uniCliServerStatus === "disconnected") {
        setStateField("uniCliServerDiagnostics", null);
        return;
      }

      void (async () => {
        try {
          const status = await client.status();
          if (!disposed) setStateField("uniCliServerDiagnostics", status);
        } catch {
          if (!disposed) setStateField("uniCliServerDiagnostics", null);
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
          uniCliAuditEntries: [],
          uniCliAuditStatus: "idle",
          uniCliAuditError: null,
        }));
        return;
      }

      const client = getClient();
      const workspaceId = state.devtoolsWorkspaceId;
      if (!client || !workspaceId) {
        mutateState((current) => ({
          ...current,
          uniCliAuditEntries: [],
          uniCliAuditStatus: "idle",
          uniCliAuditError: null,
        }));
        return;
      }

      mutateState((current) => ({
        ...current,
        uniCliAuditStatus: "loading",
        uniCliAuditError: null,
      }));

      void (async () => {
        try {
          const result = await client.listAudit(workspaceId, 50);
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uniCliAuditEntries: Array.isArray(result.items) ? result.items : [],
            uniCliAuditStatus: "idle",
          }));
        } catch (error) {
          if (disposed) return;
          mutateState((current) => ({
            ...current,
            uniCliAuditEntries: [],
            uniCliAuditStatus: "error",
            uniCliAuditError:
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

  const testuniCliServerConnection = async (next: uniCliServerSettings) => {
    const derived = normalizeuniCliServerUrl(next.urlOverride ?? "");
    if (!derived) {
      mutateState((current) => ({
        ...current,
        uniCliServerStatus: "disconnected",
        uniCliServerCapabilities: null,
        uniCliServerCheckedAt: Date.now(),
      }));
      return false;
    }

    const result = await checkuniCliServer(derived, next.token);
    consecutiveHealthFailures = result.status === "disconnected" ? consecutiveHealthFailures + 1 : 0;
    mutateState((current) => ({
      ...current,
      uniCliServerStatus: result.status,
      uniCliServerCapabilities: result.capabilities,
      uniCliServerCheckedAt: Date.now(),
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
            uniCliHostUrl: derived,
            uniCliToken: next.token ?? null,
          })
          .catch(() => undefined);
      }
    }
    return ok;
  };

  const reconnectuniCliServer = async () => {
    if (state.uniCliReconnectBusy) return false;
    setStateField("uniCliReconnectBusy", true);

    try {
      let hostInfo = state.uniCliServerHostInfo;
      if (isDesktopRuntime()) {
        try {
          hostInfo = await uniCliServerInfo() as uniCliServerInfo;
          mutateState((current) => ({ ...current, uniCliServerHostInfo: hostInfo }));
        } catch {
          hostInfo = null;
          setStateField("uniCliServerHostInfo", null);
        }
      }

      if (hostInfo?.clientToken?.trim() && options.startupPreference() !== "server") {
        const liveToken = hostInfo.clientToken.trim();
        const liveHostToken = hostInfo.hostToken?.trim() ?? "";
        const settings = state.uniCliServerSettings;
        if (
          (settings.token?.trim() ?? "") !== liveToken ||
          (settings.hostToken?.trim() ?? "") !== liveHostToken
        ) {
          updateuniCliServerSettings({
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
          uniCliServerStatus: "disconnected",
          uniCliServerCapabilities: null,
          uniCliServerCheckedAt: Date.now(),
        }));
        return false;
      }

      const result = await checkuniCliServer(url, auth.token, auth.hostToken);
      mutateState((current) => ({
        ...current,
        uniCliServerStatus: result.status,
        uniCliServerCapabilities: result.capabilities,
        uniCliServerCheckedAt: Date.now(),
      }));
      return result.status === "connected" || result.status === "limited";
    } finally {
      setStateField("uniCliReconnectBusy", false);
    }
  };

  async function ensureLocaluniCliServerClient(): Promise<uniCliServerClient | null> {
    const healthyClientFromInfo = async (
      info: uniCliServerInfo | null,
    ): Promise<uniCliServerClient | null> => {
      const baseUrl = info?.baseUrl?.trim() ?? "";
      const token = info?.clientToken?.trim() ?? "";
      if (!baseUrl || !token) return null;
      const candidate = createuniCliServerClient({
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

    const cached = await healthyClientFromInfo(state.uniCliServerHostInfo);
    if (cached) {
      if (options.startupPreference() !== "server") {
        await reconnectuniCliServer();
      }
      return cached;
    }

    if (!isDesktopRuntime()) return null;

    // A store that has not observed the server yet (a fresh route mount)
    // must not treat it as dead: the restart below tears down the embedded
    // server AND its managed engine, killing every live run. Ask the desktop
    // bridge for the live server first and restart only when that running
    // server is genuinely unreachable.
    let hostInfo: uniCliServerInfo | null = null;
    try {
      hostInfo = await uniCliServerInfo() as uniCliServerInfo;
      mutateState((current) => ({
        ...current,
        uniCliServerHostInfo: hostInfo,
        uniCliServerHostInfoReady: true,
      }));
    } catch {
      hostInfo = null;
    }
    const live = await healthyClientFromInfo(hostInfo);
    if (live) {
      if (options.startupPreference() !== "server") {
        await reconnectuniCliServer();
      }
      return live;
    }

    try {
      hostInfo = await uniCliServerRestart({
        remoteAccessEnabled: state.uniCliServerSettings.remoteAccessEnabled === true,
      }) as uniCliServerInfo;
      mutateState((current) => ({ ...current, uniCliServerHostInfo: hostInfo }));
    } catch {
      return null;
    }

    const baseUrl = hostInfo?.baseUrl?.trim() ?? "";
    const token = hostInfo?.clientToken?.trim() ?? "";
    const hostToken = hostInfo?.hostToken?.trim() ?? "";
    if (!baseUrl || !token) return null;

    if (options.startupPreference() !== "server") {
      await reconnectuniCliServer();
    }

    return createuniCliServerClient({
      baseUrl,
      token,
      hostToken: hostToken || undefined,
    });
  }

  const saveShareRemoteAccess = async (enabled: boolean) => {
    if (state.shareRemoteAccessBusy) return;
    const previous = state.uniCliServerSettings;
    const next: uniCliServerSettings = {
      ...previous,
      remoteAccessEnabled: enabled,
    };

    mutateState((current) => ({
      ...current,
      shareRemoteAccessBusy: true,
      shareRemoteAccessError: null,
    }));
    updateuniCliServerSettings(next);

    try {
      if (isDesktopRuntime() && options.selectedWorkspaceDisplay().workspaceType === "local") {
        const restarted = await options.restartLocalServer();
        if (!restarted) {
          throw new Error(t("app.error_restart_local_worker"));
        }
        await reconnectuniCliServer();
      }
    } catch (error) {
      updateuniCliServerSettings(previous);
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
    setuniCliServerSettings,
    updateuniCliServerSettings,
    resetuniCliServerSettings,
    saveShareRemoteAccess,
    checkuniCliServer,
    testuniCliServerConnection,
    reconnectuniCliServer,
    ensureLocaluniCliServerClient,
  };
}

export function useuniCliServerStoreSnapshot(store: uniCliServerStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
