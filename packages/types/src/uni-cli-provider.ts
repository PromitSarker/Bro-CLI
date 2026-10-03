import { z } from "zod"

import {
  uni-cliAffordanceDescriptorSchema,
  uni-cliProviderRefSchema,
} from "./uni-cli-affordance.js"

export const uni-cliGuidanceDescriptorSchema = z.object({
  ref: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  provider: uni-cliProviderRefSchema,
  loading: z.enum(["eager", "catalog", "on-demand"]),
})
export type uni-cliGuidanceDescriptor = z.infer<typeof uni-cliGuidanceDescriptorSchema>

export const uni-cliFeatureContributionSchema = z.object({
  featureId: z.string().trim().min(1),
  provider: uni-cliProviderRefSchema,
  affordances: z.array(uni-cliAffordanceDescriptorSchema),
  guidance: z.array(uni-cliGuidanceDescriptorSchema),
})
export type uni-cliFeatureContribution = z.infer<typeof uni-cliFeatureContributionSchema>

export const uni-cliProviderCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  contributions: z.array(uni-cliFeatureContributionSchema),
})
export type uni-cliProviderCatalog = z.infer<typeof uni-cliProviderCatalogSchema>

export const uni-cliCapabilityResultSchema = z.discriminatedUnion("status", [
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
export type uni-cliCapabilityResult = z.infer<typeof uni-cliCapabilityResultSchema>
