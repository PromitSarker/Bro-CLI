export const UNICLI_WEB_ACCESS_REQUIRED_CODE = "uni-cli_web_access_required" as const
export const UNICLI_WEB_ACCESS_REQUIRED_MESSAGE =
  "An active Uni-CLI Web subscription or complimentary access is required to use Uni-CLI Cloud."

export class UniCliWebAccessRequiredError extends Error {
  readonly code = UNICLI_WEB_ACCESS_REQUIRED_CODE

  constructor() {
    super(UNICLI_WEB_ACCESS_REQUIRED_MESSAGE)
    this.name = "UniCliWebAccessRequiredError"
  }
}

export function uniCliWebAccessRequiredPayload() {
  return {
    error: UNICLI_WEB_ACCESS_REQUIRED_CODE,
    message: UNICLI_WEB_ACCESS_REQUIRED_MESSAGE,
  }
}
