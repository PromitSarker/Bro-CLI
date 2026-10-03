// Type definitions for the desktop bridge.
// The payload shapes and the per-command contract live in
// packages/types/src/desktop-ipc.ts (shared with the Electron main process);
// this module re-exports them as the app-side import path.

import type { WorkspaceWire } from "@uni-cli/types/workspace";

export type {
  AppBuildInfo,
  BrandIconApplyResult,
  BrandIconState,
  CacheResetResult,
  DesktopBootstrapConfig,
  DesktopDistributionInfo,
  DesktopIntegrationIssue,
  DesktopIntegrationResult,
  DesktopIntegrationStatus,
  DesktopCommandArgs,
  DesktopCommandInvokers,
  DesktopCommandMap,
  DesktopCommandName,
  DesktopCommandResult,
  DesktopBinaryDownloadInput,
  DesktopBinaryDownloadResult,
  DesktopFetchInit,
  DesktopFetchResult,
  DesktopMultipartUploadInput,
  EngineDoctorResult,
  EngineInfo,
  EvalRelaunchResult,
  ExecResult,
  LocalSkillCard,
  LocalSkillContent,
  NativeContextMenuItem,
  NativeContextMenuRequest,
  NukeManifestPreview,
  NukeOptions,
  NukeReceipt,
  NukeReceiptError,
  OpencodeCommandDraft,
  OpencodeConfigFile,
  OpencodeExecutionEnvEntry,
  OpencodeExecutionSnapshot,
  uniCliDockerCleanupResult,
  uniCliServerInfo,
  UpdaterEnvironment,
  WorkspaceCreateInput,
  WorkspaceCreateRemoteInput,
  WorkspaceExportSummary,
  WorkspaceList,
  WorkspaceuniCliConfig,
  WorkspaceUpdateRemoteInput,
} from "@uni-cli/types/desktop-ipc";

// Canonical wire shape shared with uni-cli-server and the desktop bridge.
// Single source of truth: packages/types/src/workspace.ts.
export type WorkspaceInfo = WorkspaceWire;

// Browser tab state mirrored across the desktop IPC bridge. The shape is owned
// by @uni-cli/browser-tabs (shared with the Electron main process); the
// session panel store re-exports it from here.
export type { BrowserPanelTab } from "@uni-cli/browser-tabs";
