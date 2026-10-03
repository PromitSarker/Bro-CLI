export const automationsStateChangedEvent = "uni-cli:automations-state-changed"

export function dispatchAutomationsStateChanged() {
  window.dispatchEvent(new CustomEvent(automationsStateChangedEvent))
}
