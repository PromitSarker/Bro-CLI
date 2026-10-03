import { useCallback, useState } from "react";

import { uni-cliServerRestart, type uni-cliServerInfo } from "../../../app/lib/desktop";
import {
  readuni-cliServerSettings,
  writeuni-cliServerSettings,
} from "../../../app/lib/uni-cli-server";
import { t } from "../../../i18n";

export type RemoteAccessRestartPhase =
  | "idle"
  | "restarting"
  | "reconnecting"
  | "failed";

type UseRemoteAccessRestartOptions = {
  isEnabled: () => boolean;
  onHostInfo: (info: uni-cliServerInfo) => void;
  onSettingsChanged: () => void;
};

export function useRemoteAccessRestart(options: UseRemoteAccessRestartOptions) {
  const [phase, setPhase] = useState<RemoteAccessRestartPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (enabled: boolean) => {
      if (phase === "restarting" || phase === "reconnecting") return;

      const previous = readuni-cliServerSettings();
      const next = { ...previous, remoteAccessEnabled: enabled };

      setPhase("restarting");
      setError(null);
      writeuni-cliServerSettings(next);
      options.onSettingsChanged();

      try {
        const info = await uni-cliServerRestart({ remoteAccessEnabled: enabled }) as uni-cliServerInfo;
        writeuni-cliServerSettings({
          urlOverride: info.baseUrl?.trim() || undefined,
          token:
            info.ownerToken?.trim() ||
            info.clientToken?.trim() ||
            undefined,
          hostToken: info.hostToken?.trim() || undefined,
          portOverride: info.port ?? undefined,
          remoteAccessEnabled: info.remoteAccessEnabled === true,
        });
        options.onHostInfo(info);
        options.onSettingsChanged();
        setPhase("idle");
      } catch (caught) {
        writeuni-cliServerSettings(previous);
        options.onSettingsChanged();
        setError(caught instanceof Error ? caught.message : t("app.error_remote_access"));
        setPhase("failed");
      }
    },
    [options, phase],
  );

  const reset = useCallback(() => {
    if (phase === "failed") {
      setPhase("idle");
      setError(null);
    }
  }, [phase]);

  return {
    busy: phase === "restarting" || phase === "reconnecting",
    error,
    phase,
    reset,
    save,
    status: statusForPhase(phase, options.isEnabled()),
  };
}

function statusForPhase(phase: RemoteAccessRestartPhase, enabled: boolean) {
  switch (phase) {
    case "restarting":
      return "Restarting worker…";
    case "reconnecting":
      return "Reconnecting to worker…";
    case "failed":
      return enabled
        ? "Remote access may still be on. Check connection details or retry."
        : "Remote access is still off. You can retry when ready.";
    default:
      return enabled
        ? "Remote access is currently enabled."
        : "Remote access is currently disabled.";
  }
}
