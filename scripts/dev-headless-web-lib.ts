/** Compatibility exports; the implementation is owned by @uni-cli/world. */
export {
  buildDetachedRespawnArgs,
  buildHeadlessCorsOrigins,
  buildHeadlessRuntimeManifest,
  buildHeadlessServerLaunch,
  builduniCliServerArgs,
  isHeadlessStackCommand,
  mergeHeadlessServerConfig,
  normalizeDenTarget,
  resolveHeadlessRuntimeManifestPath,
  resolveHeadlessServerConfigPath,
  resolveHeadlessTokens,
} from "../packages/world/src/index.ts";

export type {
  HeadlessRuntimeManifest,
  HeadlessRuntimePids,
  HeadlessServerConfigDocument,
} from "../packages/world/src/index.ts";
