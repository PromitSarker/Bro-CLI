import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath?: string;
    }
  }
}

function resourcesPathFromAppAsarPath(path: string): string | null {
  const match = /[\\/]app\.asar(?:[\\/]|$)/.exec(path);
  return match ? path.slice(0, match.index) : null;
}

export function uniCliPluginPath(name: string, here?: string): string {
  const pluginDir = process.env.UNICLI_EXTENSIONS_PLUGIN_DIR;
  if (pluginDir) {
    return join(pluginDir, `${name}.js`);
  }

  here = here ?? dirname(fileURLToPath(import.meta.url));
  const resourcesPath = resourcesPathFromAppAsarPath(here);
  if (resourcesPath) {
    const electronResourcesPath = process.resourcesPath?.includes("app.asar") ? resourcesPath : process.resourcesPath?.trim();
    return join(electronResourcesPath || resourcesPath, "opencode-plugins", `${name}.js`);
  }

  const extension = basename(here) === "dist" ? "js" : "ts";
  return join(here, "opencode-plugins", `${name}.${extension}`);
}

export const uniCliExtensionsPreviewPluginPath = () => uniCliPluginPath("uni-cli-extensions-preview");
export const uniCliChromeDevtoolsPluginPath = () => uniCliPluginPath("uni-cli-chrome-devtools");
export const uniCliCapabilitiesKnowledgePluginPath = () => uniCliPluginPath("uni-cli-capabilities-knowledge");
export const uniCliAnthropicAdaptiveThinkingPluginPath = () => uniCliPluginPath("uni-cli-anthropic-adaptive-thinking");
export const uniCliAnthropicToolSchemaPluginPath = () => uniCliPluginPath("uni-cli-anthropic-tool-schema");
export const uniCliOfficeAttachmentsPluginPath = () => uniCliPluginPath("uni-cli-office-attachments");
export const uniCliSpreadsheetsPluginPath = () => uniCliPluginPath("uni-cli-spreadsheets");
export const uniCliPdfAttachmentsPluginPath = () => uniCliPluginPath("uni-cli-pdf-attachments");
export const uniCliTitleRecoveryPluginPath = () => uniCliPluginPath("uni-cli-title-recovery");
export const uniCliGatewayQuotaPluginPath = () => uniCliPluginPath("uni-cli-gateway-quota");
export const uniCliGatewayQuotaV2PluginPath = () => uniCliPluginPath("uni-cli-gateway-quota-v2");
export const uniCliContextV2PluginPath = () => uniCliPluginPath("uni-cli-context-v2");
export const uniCliProviderFiltersV2PluginPath = () => uniCliPluginPath("uni-cli-provider-filters-v2");
export const uniCliMcpResultsV2PluginPath = () => uniCliPluginPath("uni-cli-mcp-results-v2");
