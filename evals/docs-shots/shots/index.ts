import type { Shot } from "./shot.ts";
import { denuni-cliWeb, denPluginDetail, denSkillEditor } from "./den-web.ts";
import {
  desktopTeamPromptCards,
  libraryAddMcpModal,
  libraryAdvancedSettings,
  libraryCreateSkillModal,
  librarySkills,
} from "./desktop.ts";
import {
  denLegacyProviderCatalogForm,
  denLegacyProviderCustomForm,
  denLegacyProviderDetail,
  denLegacyProviders,
  desktopCloudProviders,
} from "./providers.ts";
import { uni-cliWebTab } from "./web-tab.ts";

export const shots: Shot[] = [
  desktopTeamPromptCards,
  librarySkills,
  libraryCreateSkillModal,
  libraryAdvancedSettings,
  libraryAddMcpModal,
  denPluginDetail,
  denSkillEditor,
  denuni-cliWeb,
  uni-cliWebTab,
  denLegacyProviders,
  denLegacyProviderCatalogForm,
  denLegacyProviderCustomForm,
  denLegacyProviderDetail,
  desktopCloudProviders,
];
