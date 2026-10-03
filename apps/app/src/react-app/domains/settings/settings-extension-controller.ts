/** @jsxImportSource react */
import { useCallback } from "react";

import type { McpDirectoryInfo } from "../../../app/constants";
import { evaluateEnablement, type EnablementContext } from "../../../app/enablement";
import type { uniCliServerClient } from "../../../app/lib/uni-cli-server";
import { getExtensionConfigSlot, type ExtensionConfigContext } from "./extension-registry";
import type { LocalProviderInstallInput } from "./openai-image-extension";

type ProviderLike = {
  id: string;
  source?: string | null;
};

type SettingsExtensionControllerInput = {
  uniCliServerClient: uniCliServerClient | null;
  hostuniCliServerClient: uniCliServerClient | null;
  enablementContext: EnablementContext;
  restartLocalServer?: () => Promise<boolean>;
  providers: ProviderLike[];
  providerConnectedIds: string[];
  userEnvKeys: string[];
  imageExtension: {
    busy: boolean;
    status: string | null;
    error: string | null;
    onInstall: (apiKey: string) => void | Promise<void>;
    onTestGenerate: (input: { apiKey: string; prompt: string }) => void | Promise<void>;
  };
  localProvider: {
    busy: boolean;
    status: string | null;
    error: string | null;
    onInstall: (input: LocalProviderInstallInput) => void | Promise<void>;
  };
};

function hasOpenAiEnv(input: Pick<SettingsExtensionControllerInput, "providers" | "providerConnectedIds" | "userEnvKeys">) {
  return input.userEnvKeys.includes("OPENAI_REALTIME_API_KEY") ||
    input.userEnvKeys.includes("OPENAI_API_KEY") ||
    input.userEnvKeys.includes("UNICLI_OPENAI_IMAGE_API_KEY") ||
    input.providers.some((provider) => provider.id === "openai" && provider.source === "env") ||
    input.providerConnectedIds.includes("openai");
}

export function useSettingsExtensionController(input: SettingsExtensionControllerInput) {
  const configContextForEntry = useCallback((entry: McpDirectoryInfo): ExtensionConfigContext => ({
    uniCliServerClient: input.uniCliServerClient,
    hostuniCliServerClient: input.hostuniCliServerClient,
    restartLocalServer: input.restartLocalServer,
    imageExtension: {
      ...input.imageExtension,
      envKeyDetected: hasOpenAiEnv(input),
    },
    localProvider: input.localProvider,
  }), [input]);

  const configSlotForEntry = useCallback(
    (entry: McpDirectoryInfo) => getExtensionConfigSlot(entry, configContextForEntry(entry)),
    [configContextForEntry],
  );

  const isConnected = useCallback((entry: McpDirectoryInfo) => {
    const enablement = entry.extensionManifest?.enablement;
    return enablement ? evaluateEnablement(enablement, input.enablementContext).active : false;
  }, [input.enablementContext]);

  return {
    configContextForEntry,
    configSlotForEntry,
    isConnected,
  };
}
