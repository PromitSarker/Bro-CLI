import { z } from "zod"

import {
  uniCliAffordanceDescriptorSchema,
  uniCliProviderRefSchema,
} from "./uni-cli-affordance.js"

export const uniCliGuidanceDescriptorSchema = z.object({
  ref: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  provider: uniCliProviderRefSchema,
  loading: z.enum(["eager", "catalog", "on-demand"]),
})
export type uniCliGuidanceDescriptor = z.infer<typeof uniCliGuidanceDescriptorSchema>

export const uniCliFeatureContributionSchema = z.object({
  featureId: z.string().trim().min(1),
  provider: uniCliProviderRefSchema,
  affordances: z.array(uniCliAffordanceDescriptorSchema),
  guidance: z.array(uniCliGuidanceDescriptorSchema),
})
export type uniCliFeatureContribution = z.infer<typeof uniCliFeatureContributionSchema>

export const uniCliProviderCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  contributions: z.array(uniCliFeatureContributionSchema),
})
export type uniCliProviderCatalog = z.infer<typeof uniCliProviderCatalogSchema>

export const uniCliCapabilityResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("completed"),
    data: z.unknown(),
    additionalContext: z.array(z.string()).optional(),
  }),
  z.object({
    status: z.literal("guidance"),
    instructions: z.array(z.string()),
  }),
  z.object({
    status: z.literal("requires-user-action"),
    message: z.string(),
    action: z.string().optional(),
  }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    retryable: z.boolean(),
  }),
])
export type uniCliCapabilityResult = z.infer<typeof uniCliCapabilityResultSchema>
