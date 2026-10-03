export const NO_SESSION_SIDE_PANEL_KEY = "__uniCli_no_session__";

export function getSidePanelSessionKey(sessionId: string | null) {
  if (!sessionId?.trim()) {
    return NO_SESSION_SIDE_PANEL_KEY;
  }

  return sessionId;
}
