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

export function uni-cliPluginPath(name: string, here?: string): string {
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

export const uni-cliExtensionsPreviewPluginPath = () => uni-cliPluginPath("uni-cli-extensions-preview");
export const uni-cliChromeDevtoolsPluginPath = () => uni-cliPluginPath("uni-cli-chrome-devtools");
export const uni-cliCapabilitiesKnowledgePluginPath = () => uni-cliPluginPath("uni-cli-capabilities-knowledge");
export const uni-cliAnthropicAdaptiveThinkingPluginPath = () => uni-cliPluginPath("uni-cli-anthropic-adaptive-thinking");
export const uni-cliAnthropicToolSchemaPluginPath = () => uni-cliPluginPath("uni-cli-anthropic-tool-schema");
export const uni-cliOfficeAttachmentsPluginPath = () => uni-cliPluginPath("uni-cli-office-attachments");
export const uni-cliSpreadsheetsPluginPath = () => uni-cliPluginPath("uni-cli-spreadsheets");
export const uni-cliPdfAttachmentsPluginPath = () => uni-cliPluginPath("uni-cli-pdf-attachments");
export const uni-cliTitleRecoveryPluginPath = () => uni-cliPluginPath("uni-cli-title-recovery");
export const uni-cliGatewayQuotaPluginPath = () => uni-cliPluginPath("uni-cli-gateway-quota");
export const uni-cliGatewayQuotaV2PluginPath = () => uni-cliPluginPath("uni-cli-gateway-quota-v2");
export const uni-cliContextV2PluginPath = () => uni-cliPluginPath("uni-cli-context-v2");
export const uni-cliProviderFiltersV2PluginPath = () => uni-cliPluginPath("uni-cli-provider-filters-v2");
export const uni-cliMcpResultsV2PluginPath = () => uni-cliPluginPath("uni-cli-mcp-results-v2");
