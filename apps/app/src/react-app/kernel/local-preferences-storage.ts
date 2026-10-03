export const LOCAL_PREFERENCES_KEY = "uni-cli.preferences";

export type LinkOpenDestination = "uni-cli" | "external";

export function isLinkOpenDestination(value: unknown): value is LinkOpenDestination {
  return value === "uni-cli" || value === "external";
}
