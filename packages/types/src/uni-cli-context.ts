import { z } from "zod"

import {
  uni-cliAffordanceDescriptorSchema,
  uni-cliProviderRefSchema,
} from "./uni-cli-affordance.js"
import { uni-cliFeatureContributionSchema } from "./uni-cli-provider.js"

export const UNICLI_CONTEXT_SCHEMA_VERSION = 1

export const uni-cliSessionRefSchema = z.object({
  workspaceId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  title: z.string().optional(),
})
export type uni-cliSessionRef = z.infer<typeof uni-cliSessionRefSchema>

export const uni-cliScreenSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("conversation"),
    route: z.string(),
    workspaceId: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  z.object({
    kind: z.literal("settings"),
    route: z.string(),
    workspaceId: z.string().optional(),
    panel: z.string(),
  }),
  z.object({
    kind: z.literal("other"),
    route: z.string(),
  }),
])
export type uni-cliScreen = z.infer<typeof uni-cliScreenSchema>

export const uni-cliConversationLayoutSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("empty") }),
  z.object({
    kind: z.literal("single"),
    sessionId: z.string(),
    workspaceId: z.string().optional(),
  }),
  z.object({
    kind: z.literal("split"),
    primarySessionId: z.string(),
    primaryWorkspaceId: z.string().optional(),
    secondarySessionId: z.string(),
    secondaryWorkspaceId: z.string().optional(),
    focused: z.enum(["primary", "secondary"]),
  }),
])
export type uni-cliConversationLayout = z.infer<typeof uni-cliConversationLayoutSchema>

export const uni-cliPanelTabSchema = z.object({
  id: z.string(),
  kind: z.enum(["browser", "artifact"]),
  label: z.string(),
  url: z.string().optional(),
  status: z.enum(["loading", "ready", "suspending", "suspended", "restoring"]).optional(),
})
export type uni-cliPanelTab = z.infer<typeof uni-cliPanelTabSchema>

export const uni-cliResourceDescriptorSchema = z.object({
  ref: z.string().trim().min(1),
  kind: z.enum(["workspace", "session", "screen", "side-panel", "settings"]),
  title: z.string(),
  provider: uni-cliProviderRefSchema,
  state: z.record(z.string(), z.unknown()),
})
export type uni-cliResourceDescriptor = z.infer<typeof uni-cliResourceDescriptorSchema>

export const uni-cliContextSnapshotSchema = z.object({
  schemaVersion: z.literal(UNICLI_CONTEXT_SCHEMA_VERSION),
  revision: z.number().int().nonnegative(),
  capturedAt: z.string(),
  features: z.object({
    connectionQuestions: z.boolean().optional(),
  }).optional(),
  screen: uni-cliScreenSchema,
  conversations: z.object({
    tabs: z.array(uni-cliSessionRefSchema),
    layout: uni-cliConversationLayoutSchema,
    pinnedSessionIds: z.array(z.string()),
  }),
  chrome: z.object({
    sidebarOpen: z.boolean(),
    applicationMenuVisible: z.boolean(),
    rightSidebarExpanded: z.boolean(),
  }),
  execution: z.object({
    queries: z.literal("parallel"),
    commands: z.literal("serialized"),
    busyCommandId: z.string().nullable(),
    busyActor: z.string().nullable(),
  }),
  sidePanel: z.object({
    open: z.boolean(),
    ownerSessionId: z.string().nullable(),
    kind: z.enum(["panel", "extensions"]).nullable(),
    tabs: z.array(uni-cliPanelTabSchema),
    activeTabId: z.string().nullable(),
  }),
  resources: z.array(uni-cliResourceDescriptorSchema),
  availableAffordances: z.array(uni-cliAffordanceDescriptorSchema),
  contributions: z.array(uni-cliFeatureContributionSchema),
})
export type uni-cliContextSnapshot = z.infer<typeof uni-cliContextSnapshotSchema>
