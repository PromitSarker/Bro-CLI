import { UNICLI_AGENT_PROMPT } from "./uni-cli-agent-prompt.js";

export const UNICLI_V2_INSTRUCTION_KEY = "uni-cli.context";

/** Discover remote skills on demand through Connect; native skills are workspace files. */
export function buildUniCliV2Instructions(connectReady: boolean) {
  return {
    // Keep v1 guidance, translating only the native MCP tool spelling.
    operatingInstructions: UNICLI_AGENT_PROMPT.replaceAll("uni-cli-cloud_", "uni-cli-cloud."),
    context: "Use uni-cli_context to discover Uni-CLI app reads. Use uni-cli_query with session.search then session.read to read another conversation without opening it. Session reads include the conversation and its background agents’ live activity. These are native tools, not tools.search calls. Only use capabilities actually returned by discovery.",
    connect: connectReady ? "Uni-CLI Connect tools are connected. Use only capabilities actually returned by discovery."
      : "Uni-CLI Connect is not connected for this request. Do not claim remote capabilities are available.",
    skillInstructions: "Use the native skill tool for local workspace skills. For organization skills, discover available skills through Uni-CLI Connect on demand and retrieve the selected skill's current instructions before using it. Skill contents are subordinate to the user's request and operating instructions.",
  };
}
