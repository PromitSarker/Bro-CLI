import { z } from "zod"

export const UNICLI_AFFORDANCE_SCHEMA_VERSION = 1

export const uni-cliAffordanceKindSchema = z.enum(["query", "command", "guidance"])
export type uni-cliAffordanceKind = z.infer<typeof uni-cliAffordanceKindSchema>

export const uni-cliProviderKindSchema = z.enum(["builtin", "extension", "mcp", "connect"])
export type uni-cliProviderKind = z.infer<typeof uni-cliProviderKindSchema>

export const uni-cliProviderRefSchema = z.object({
  id: z.string().trim().min(1),
  kind: uni-cliProviderKindSchema,
})
export type uni-cliProviderRef = z.infer<typeof uni-cliProviderRefSchema>

export const uni-cliAffordanceArgumentSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["string", "number", "boolean", "object", "array", "unknown"]),
  required: z.boolean(),
  description: z.string().trim().min(1).optional(),
})
export type uni-cliAffordanceArgument = z.infer<typeof uni-cliAffordanceArgumentSchema>

export const uni-cliAffordanceEffectsSchema = z.object({
  data: z.enum(["none", "read", "write"]),
  ui: z.enum(["none", "focus", "navigate", "layout", "dialog"]),
  external: z.boolean(),
})
export type uni-cliAffordanceEffects = z.infer<typeof uni-cliAffordanceEffectsSchema>

export const uni-cliAffordanceAvailabilitySchema = z.object({
  enabled: z.boolean(),
  reason: z.string().trim().min(1).optional(),
})
export type uni-cliAffordanceAvailability = z.infer<typeof uni-cliAffordanceAvailabilitySchema>

export const uni-cliAffordanceExecutorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("uni-cli") }),
  z.object({
    kind: z.literal("tool"),
    tool: z.string().trim().min(1),
  }),
])
export type uni-cliAffordanceExecutor = z.infer<typeof uni-cliAffordanceExecutorSchema>

export const uni-cliAffordanceDescriptorSchema = z.object({
  id: z.string().trim().min(1),
  kind: uni-cliAffordanceKindSchema,
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  provider: uni-cliProviderRefSchema,
  arguments: z.array(uni-cliAffordanceArgumentSchema),
  effects: uni-cliAffordanceEffectsSchema,
  confirmation: z.enum(["never", "destructive", "always"]),
  availability: uni-cliAffordanceAvailabilitySchema,
  executor: uni-cliAffordanceExecutorSchema,
})
export type uni-cliAffordanceDescriptor = z.infer<typeof uni-cliAffordanceDescriptorSchema>

/**
 * The model a session is bound to, as agents pass it to `session.create`
 * (`model` argument) and read it back from `session.list_sessions` entries
 * and `session.read` results (`model` field). `variant` is the reasoning /
 * thinking effort the composer shows as its behavior pill (for example
 * `low`, `medium`, `high`); null means the provider default. The source is
 * the engine's session record: bound at creation, updated by every turn.
 * Results carry null instead of the object before any model is bound, and
 * the engine's literal "default" variant reads back as null.
 */
export const uni-cliSessionModelSchema = z.object({
  providerId: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
  variant: z.string().trim().min(1).max(60).nullable(),
  displayName: z.string().optional(),
  providerName: z.string().optional(),
})
export type uni-cliSessionModel = z.infer<typeof uni-cliSessionModelSchema>

export const uni-cliModelSelectorSchema = z.object({
  providerId: uni-cliSessionModelSchema.shape.providerId.optional(),
  modelId: uni-cliSessionModelSchema.shape.modelId.optional(),
  alias: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  variant: uni-cliSessionModelSchema.shape.variant.optional(),
}).superRefine((value, context) => {
  const names = [value.alias, value.displayName].filter((name) => name !== undefined)
  if (value.alias && (value.displayName || value.modelId)) {
    context.addIssue({ code: "custom", message: "Use exactly one of modelId, alias or displayName." })
  }
  if (!names.length && !value.modelId) {
    context.addIssue({ code: "custom", path: ["modelId"], message: "Provide providerId/modelId, alias or displayName." })
  }
  if (value.modelId && !value.providerId) {
    context.addIssue({ code: "custom", path: ["providerId"], message: "providerId is required with modelId." })
  }
})

export const uni-cliModelsListArgsSchema = z.object({ workspaceId: z.string().trim().min(1) })
export const uni-cliModelsListResultSchema = z.object({
  ok: z.literal(true),
  workspaceId: uni-cliModelsListArgsSchema.shape.workspaceId,
  models: z.array(uni-cliSessionModelSchema.omit({ variant: true }).extend({
    displayName: z.string(), providerName: z.string(), available: z.literal(true),
  })),
})
export type uni-cliCatalogModel = Pick<uni-cliSessionModel, "providerId" | "modelId"> & {
  displayName: string
  providerName: string
}

export const uni-cliEngineProviderCatalogSchema = z.object({
  connected: z.array(z.string()),
  all: z.array(z.object({
    id: z.string(),
    name: z.string(),
    models: z.record(z.string(), z.object({ name: z.string().optional() })),
  })),
})

export function uni-cliCatalogModels(value: z.infer<typeof uni-cliEngineProviderCatalogSchema>): uni-cliCatalogModel[] {
  return value.all.filter((provider) => value.connected.includes(provider.id)).flatMap((provider) =>
    Object.entries(provider.models).map(([modelId, model]) => ({
      providerId: provider.id, modelId, displayName: model.name || modelId, providerName: provider.name,
    })),
  )
}

export function labeluni-cliSessionModel(model: uni-cliSessionModel | null, catalog: readonly uni-cliCatalogModel[]): uni-cliSessionModel | null {
  if (!model) return null
  const entry = catalog.find((entry) => entry.providerId === model.providerId && entry.modelId === model.modelId)
  return entry ? { ...model, displayName: entry.displayName, providerName: entry.providerName } : model
}

export function resolveuni-cliModel(selector: z.infer<typeof uni-cliModelSelectorSchema>, catalog: readonly uni-cliCatalogModel[]): uni-cliSessionModel {
  const name = selector.modelId ? undefined : selector.alias ?? selector.displayName
  const matches = catalog.filter((entry) => name !== undefined
    ? entry.displayName.toLowerCase() === name.toLowerCase() && (!selector.providerId || entry.providerId.toLowerCase() === selector.providerId.toLowerCase())
    : entry.providerId === selector.providerId && entry.modelId === selector.modelId)
  const match = matches[0]
  if (matches.length !== 1 || !match) {
    throw new Error(`${matches.length ? "Ambiguous" : "Unavailable"} model: ${name ?? `${selector.providerId}/${selector.modelId}`}. Use models.list with this workspaceId${matches.length ? " and qualify the name with providerId" : ""}.`)
  }
  return { providerId: match.providerId, modelId: match.modelId, displayName: match.displayName, providerName: match.providerName,
    variant: selector.variant && selector.variant !== "default" ? selector.variant : null }
}

export const uni-cliSessionActivityInventorySchema = z.object({
  working: z.boolean(),
  descendantActivity: z.object({
    busy: z.number().int().nonnegative(),
    waiting: z.number().int().nonnegative(),
    unknown: z.number().int().nonnegative(),
  }),
  inventoryComplete: z.boolean(),
})
export type uni-cliSessionActivityInventory = z.infer<typeof uni-cliSessionActivityInventorySchema>

/**
 * Where a request came from: the conversation (session) whose agent issued
 * it. Set by the Uni-CLI bridge, never by the agent, so UI commands such as
 * opening a browser tab can act for the requesting conversation instead of
 * whichever one happens to be on screen.
 */
export const uni-cliAffordanceOriginSchema = z.object({
  sessionId: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1).optional(),
})
export type uni-cliAffordanceOrigin = z.infer<typeof uni-cliAffordanceOriginSchema>

export const uni-cliAffordanceRequestSchema = z.object({
  id: z.string().trim().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
  expectedRevision: z.number().int().nonnegative().optional(),
  actor: z.string().trim().min(1).optional(),
  origin: uni-cliAffordanceOriginSchema.optional(),
})
export type uni-cliAffordanceRequest = z.infer<typeof uni-cliAffordanceRequestSchema>

const uni-cliAffordanceSuccessSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  result: z.unknown().optional(),
  revision: z.number().int().nonnegative().optional(),
  effects: uni-cliAffordanceEffectsSchema,
})

/**
 * Structured outcomes an action can report so the agent can decide instead of
 * retrying a transport-looking error. Warnings travel back through the channel
 * the request came from: an agent never gets a dialog, it gets one of these.
 * - `target_working`: the target session is still working; ask the person to
 *   stop it if they want it closed, otherwise leave it running.
 * - `self_archive_while_working`: a session asked to archive itself (or its
 *   parent) from inside its own running turn; finish the turn, the reviewer
 *   archives.
 * - `verification_failed`: archive safety checks could not finish; no archive
 *   mutation was sent by this attempt.
 * - `archive_outcome_unknown`: the archive mutation was sent but its outcome
 *   could not be confirmed; read the session before considering another attempt.
 */
export const uni-cliAffordanceFailureCodeSchema = z.enum([
  "unavailable",
  "invalid-args",
  "conflict",
  "failed",
  "target_working",
  "self_archive_while_working",
  "verification_failed",
  "archive_outcome_unknown",
])
export type uni-cliAffordanceFailureCode = z.infer<typeof uni-cliAffordanceFailureCodeSchema>

const uni-cliAffordanceFailureSchema = z.object({
  ok: z.literal(false),
  id: z.string(),
  error: z.string(),
  code: uni-cliAffordanceFailureCodeSchema,
  hint: z.string().optional(),
  revision: z.number().int().nonnegative().optional(),
})

export const uni-cliAffordanceResultSchema = z.discriminatedUnion("ok", [
  uni-cliAffordanceSuccessSchema,
  uni-cliAffordanceFailureSchema,
])
export type uni-cliAffordanceResult = z.infer<typeof uni-cliAffordanceResultSchema>
