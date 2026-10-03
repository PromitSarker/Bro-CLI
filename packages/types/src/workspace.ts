/**
 * Shared wire contract for workspace records.
 *
 * Producers:
 * - uni-cli-server (apps/server): `GET /workspaces` and friends — emits plain
 *   optionals (never null) plus the `opencode*` engine credential fields.
 * - desktop Electron IPC bridge (apps/desktop main.mjs): emits explicit nulls
 *   and the desktop-managed `uni-cliClientToken`/`uni-cliHostToken`.
 *
 * Consumers (apps/app) must treat every optional field as possibly absent,
 * undefined, or null. Producer-side types assert assignability against this
 * shape (see apps/server/src/types.ts) so drift fails typecheck instead of
 * surfacing as runtime undefined-field bugs.
 */
export type WorkspaceKind = "local" | "remote";

export type WorkspaceRemoteKind = "opencode" | "uni-cli";

export type WorkspaceWire = {
  id: string;
  name: string;
  path: string;
  preset: string;
  workspaceType: WorkspaceKind;
  remoteType?: WorkspaceRemoteKind | null;
  baseUrl?: string | null;
  directory?: string | null;
  displayName?: string | null;
  uni-cliHostUrl?: string | null;
  uni-cliToken?: string | null;
  /** Desktop IPC only: tokens for desktop-managed remote workspaces. */
  uni-cliClientToken?: string | null;
  uni-cliHostToken?: string | null;
  uni-cliWorkspaceId?: string | null;
  uni-cliWorkspaceName?: string | null;
  /**
   * Vocabulary differs per producer today ("docker" | "microsandbox" on the
   * desktop, "none" | "docker" | "container" in uni-cli-server), so the wire
   * stays a plain string until the backends converge.
   */
  sandboxBackend?: string | null;
  sandboxRunId?: string | null;
  sandboxContainerName?: string | null;
  /** uni-cli-server only: credentials for the proxied opencode engine. */
  opencodeUsername?: string | null;
  opencodePassword?: string | null;
  opencode?: {
    baseUrl?: string;
    directory?: string;
    username?: string;
    password?: string;
  } | null;
};
