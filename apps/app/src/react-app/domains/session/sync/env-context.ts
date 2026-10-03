import { sideChatSystemContext } from "../chat/workbench-store";
import type { uniCliServerClient } from "../../../../app/lib/uni-cli-server";
import { readuniCliEnvPendingChanges } from "../../../../app/lib/uni-cli-env-runtime";
import { readuniCliRuntimeFacts, renderuniCliRuntimeContext } from "./runtime-context";

const DEFAULT_CACHE_KEY = "__uni-cli_env_default__";
const MAX_CONTEXT_CACHE_ENTRIES = 100;

const envSystemContextCache = new Map<string, string | undefined>();

export function clearuniCliEnvSystemContextCache(): void {
  envSystemContextCache.clear();
}

function normalizeEnvKeys(keys: string[]): string[] {
  return Array.from(
    new Set(
      keys.flatMap((key) => {
        const trimmed = key.trim();
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed) ? [trimmed] : [];
      }),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export async function builduniCliEnvSystemContext(
  client: uniCliServerClient | null,
  options: {
    cacheKey?: string;
    runtimeKey?: string | null;
    readPendingChanges?: () => boolean;
    desktopTransport?: "main";
  } = {},
): Promise<string | undefined> {
  if (!client) return undefined;
  const readPendingChanges = options.readPendingChanges ??
    (() => readuniCliEnvPendingChanges(options.runtimeKey));
  if (readPendingChanges()) return undefined;

  const cacheKey = `${client.baseUrl}:${options.cacheKey ?? DEFAULT_CACHE_KEY}`;
  if (envSystemContextCache.has(cacheKey)) {
    return envSystemContextCache.get(cacheKey);
  }

  try {
    const response = await client.listUserEnvKeys(options.desktopTransport ? { desktopTransport: options.desktopTransport } : undefined);
    const keys = normalizeEnvKeys(response.keys ?? []);
    if (keys.length === 0) {
      rememberEnvSystemContext(cacheKey, undefined);
      return undefined;
    }

    const keyList = keys.map((key) => `- ${key}`).join("\n");

    const context = [
      "Uni-CLI environment variables configured:",
      keyList,
      "Only names are shown; values are secret. Use these names when relevant.",
    ].join("\n");
    rememberEnvSystemContext(cacheKey, context);
    return context;
  } catch {
    return undefined;
  }
}

function rememberEnvSystemContext(cacheKey: string, context: string | undefined): void {
  if (envSystemContextCache.size >= MAX_CONTEXT_CACHE_ENTRIES && !envSystemContextCache.has(cacheKey)) {
    const firstKey = envSystemContextCache.keys().next().value;
    if (firstKey) envSystemContextCache.delete(firstKey);
  }
  envSystemContextCache.set(cacheKey, context);
}

/**
 * The per-message `system` context every send carries: the user's time zone,
 * local date, and locale (computed fresh each send so a long-lived session
 * crosses midnight correctly), followed by the cached environment-key names
 * when the workspace has any.
 */
export async function builduniCliSessionSystemContext(
  client: uniCliServerClient | null,
  options: {
    workspaceId?: string;
    cacheKey?: string;
    runtimeKey?: string | null;
    readPendingChanges?: () => boolean;
    desktopTransport?: "main";
  } = {},
): Promise<string> {
  const envContext = await builduniCliEnvSystemContext(client, options);
  const runtimeContext = renderuniCliRuntimeContext(readuniCliRuntimeFacts());
  const sideChatContext = options.workspaceId && options.cacheKey
    ? sideChatSystemContext(options.workspaceId, options.cacheKey) : undefined;
  return [runtimeContext, envContext, sideChatContext].filter(Boolean).join("\n\n");
}
