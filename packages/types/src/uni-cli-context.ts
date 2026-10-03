import { z } from "zod"

import {
  uniCliAffordanceDescriptorSchema,
  uniCliProviderRefSchema,
} from "./uni-cli-affordance.js"
import { uniCliFeatureContributionSchema } from "./uni-cli-provider.js"

export const UNICLI_CONTEXT_SCHEMA_VERSION = 1

export const uniCliSessionRefSchema = z.object({
  workspaceId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  title: z.string().optional(),
})
export type uniCliSessionRef = z.infer<typeof uniCliSessionRefSchema>

export const uniCliScreenSchema = z.discriminatedUnion("kind", [
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
export type uniCliScreen = z.infer<typeof uniCliScreenSchema>

export const uniCliConversationLayoutSchema = z.discriminatedUnion("kind", [
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
export type uniCliConversationLayout = z.infer<typeof uniCliConversationLayoutSchema>

export const uniCliPanelTabSchema = z.object({
  id: z.string(),
  kind: z.enum(["browser", "artifact"]),
  label: z.string(),
  url: z.string().optional(),
  status: z.enum(["loading", "ready", "suspending", "suspended", "restoring"]).optional(),
})
export type uniCliPanelTab = z.infer<typeof uniCliPanelTabSchema>

export const uniCliResourceDescriptorSchema = z.object({
  ref: z.string().trim().min(1),
  kind: z.enum(["workspace", "session", "screen", "side-panel", "settings"]),
  title: z.string(),
  provider: uniCliProviderRefSchema,
  state: z.record(z.string(), z.unknown()),
})
export type uniCliResourceDescriptor = z.infer<typeof uniCliResourceDescriptorSchema>

export const uniCliContextSnapshotSchema = z.object({
  schemaVersion: z.literal(UNICLI_CONTEXT_SCHEMA_VERSION),
  revision: z.number().int().nonnegative(),
  capturedAt: z.string(),
  features: z.object({
    connectionQuestions: z.boolean().optional(),
  }).optional(),
  screen: uniCliScreenSchema,
  conversations: z.object({
    tabs: z.array(uniCliSessionRefSchema),
    layout: uniCliConversationLayoutSchema,
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
    tabs: z.array(uniCliPanelTabSchema),
    activeTabId: z.string().nullable(),
  }),
  resources: z.array(uniCliResourceDescriptorSchema),
  availableAffordances: z.array(uniCliAffordanceDescriptorSchema),
  contributions: z.array(uniCliFeatureContributionSchema),
})
export type uniCliContextSnapshot = z.infer<typeof uniCliContextSnapshotSchema>
