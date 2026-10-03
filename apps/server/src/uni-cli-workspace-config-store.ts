import type { ServerConfig } from "./types.js";
import { createWorkspaceKvStore, isRecord } from "./workspace-kv-store.js";

function normalizeuniCliWorkspaceConfig(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function parseuniCliWorkspaceConfig(configJson: string): Record<string, unknown> {
  try {
    return normalizeuniCliWorkspaceConfig(JSON.parse(configJson));
  } catch {
    return {};
  }
}

const uniCliWorkspaceConfigStore = createWorkspaceKvStore<Record<string, unknown>>({
  tableName: "uni-cli_workspace_configs",
  valueColumn: "config_json",
  parse: parseuniCliWorkspaceConfig,
  serialize: (value) => JSON.stringify(value),
});

export async function readuniCliWorkspaceConfig(config: ServerConfig, workspaceId: string): Promise<Record<string, unknown>> {
  return await uniCliWorkspaceConfigStore.get(config, workspaceId) ?? {};
}

export async function writeuniCliWorkspaceConfig(
  config: ServerConfig,
  workspaceId: string,
  updater: (current: Record<string, unknown>) => Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next = normalizeuniCliWorkspaceConfig(updater(await readuniCliWorkspaceConfig(config, workspaceId)));
  await uniCliWorkspaceConfigStore.set(config, workspaceId, next);
  return next;
}

export async function hasuniCliWorkspaceConfig(
  config: ServerConfig,
  workspaceId: string,
): Promise<boolean> {
  return uniCliWorkspaceConfigStore.has(config, workspaceId);
}

/**
 * Seed the DB-backed uni-cli config for a workspace if no row exists yet.
 * Used at workspace creation and as the migrate-on-read landing spot for
 * legacy `.opencode/uni-cli.json` files. No-op when a row is already present,
 * so it never clobbers live provisioning state.
 */
export async function seeduniCliWorkspaceConfigIfEmpty(
  config: ServerConfig,
  workspaceId: string,
  seed: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (await hasuniCliWorkspaceConfig(config, workspaceId)) {
    return readuniCliWorkspaceConfig(config, workspaceId);
  }
  return writeuniCliWorkspaceConfig(config, workspaceId, () => seed);
}

export function mergeuniCliWorkspaceConfigs(
  legacy: Record<string, unknown>,
  stored: Record<string, unknown>,
): Record<string, unknown> {
  return { ...legacy, ...stored };
}
