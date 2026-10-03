import { readOrganizationMetadata } from "@uni-cli/types/den/managed-models-policy"

export type Uni-CLIWebAccessSource = "subscription" | "complimentary" | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseMetadata(value: Record<string, unknown> | string | null | undefined): Record<string, unknown> {
  if (!value) {
    return {}
  }
  if (typeof value !== "string") {
    return value
  }
  try {
    const parsed: unknown = JSON.parse(value)
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function hasUni-CLIWebComplimentaryAccess(metadata: Record<string, unknown> | string | null | undefined) {
  const complimentaryAccess = parseMetadata(metadata).complimentaryAccess
  return isRecord(complimentaryAccess) && complimentaryAccess.uni-cliWeb === true
}

export function setUni-CLIWebComplimentaryAccess(metadata: unknown, enabled: boolean) {
  const nextMetadata = { ...readOrganizationMetadata(metadata) }
  const current = isRecord(nextMetadata.complimentaryAccess) ? nextMetadata.complimentaryAccess : {}
  const complimentaryAccess = { ...current }

  if (enabled) {
    complimentaryAccess.uni-cliWeb = true
  } else {
    delete complimentaryAccess.uni-cliWeb
  }

  if (Object.keys(complimentaryAccess).length > 0) {
    nextMetadata.complimentaryAccess = complimentaryAccess
  } else {
    delete nextMetadata.complimentaryAccess
  }

  return nextMetadata
}

export function resolveUni-CLIWebAccess(input: {
  deploymentAvailable: boolean
  hasEligibleSubscription: boolean
  complimentaryAccess: boolean
}): {
  hasAccess: boolean
  accessSource: Uni-CLIWebAccessSource
  complimentaryAccess: boolean
} {
  const accessSource: Uni-CLIWebAccessSource = input.deploymentAvailable && input.hasEligibleSubscription
    ? "subscription"
    : input.complimentaryAccess
      ? "complimentary"
      : null

  return {
    hasAccess: accessSource !== null,
    accessSource,
    complimentaryAccess: input.complimentaryAccess,
  }
}
