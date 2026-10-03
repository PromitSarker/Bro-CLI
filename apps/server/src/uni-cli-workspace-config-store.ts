import type { ServerConfig } from "./types.js";
import { createWorkspaceKvStore, isRecord } from "./workspace-kv-store.js";

function normalizeuni-cliWorkspaceConfig(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function parseuni-cliWorkspaceConfig(configJson: string): Record<string, unknown> {
  try {
    return normalizeuni-cliWorkspaceConfig(JSON.parse(configJson));
  } catch {
    return {};
  }
}

const uni-cliWorkspaceConfigStore = createWorkspaceKvStore<Record<string, unknown>>({
  tableName: "uni-cli_workspace_configs",
  valueColumn: "config_json",
  parse: parseuni-cliWorkspaceConfig,
  serialize: (value) => JSON.stringify(value),
});

export async function readuni-cliWorkspaceConfig(config: ServerConfig, workspaceId: string): Promise<Record<string, unknown>> {
  return await uni-cliWorkspaceConfigStore.get(config, workspaceId) ?? {};
}

export async function writeuni-cliWorkspaceConfig(
  config: ServerConfig,
  workspaceId: string,
  updater: (current: Record<string, unknown>) => Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next = normalizeuni-cliWorkspaceConfig(updater(await readuni-cliWorkspaceConfig(config, workspaceId)));
  await uni-cliWorkspaceConfigStore.set(config, workspaceId, next);
  return next;
}

export async function hasuni-cliWorkspaceConfig(
  config: ServerConfig,
  workspaceId: string,
): Promise<boolean> {
  return uni-cliWorkspaceConfigStore.has(config, workspaceId);
}

/**
 * Seed the DB-backed uni-cli config for a workspace if no row exists yet.
 * Used at workspace creation and as the migrate-on-read landing spot for
 * legacy `.opencode/uni-cli.json` files. No-op when a row is already present,
 * so it never clobbers live provisioning state.
 */
export async function seeduni-cliWorkspaceConfigIfEmpty(
  config: ServerConfig,
  workspaceId: string,
  seed: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (await hasuni-cliWorkspaceConfig(config, workspaceId)) {
    return readuni-cliWorkspaceConfig(config, workspaceId);
  }
  return writeuni-cliWorkspaceConfig(config, workspaceId, () => seed);
}

export function mergeuni-cliWorkspaceConfigs(
  legacy: Record<string, unknown>,
  stored: Record<string, unknown>,
): Record<string, unknown> {
  return { ...legacy, ...stored };
}
