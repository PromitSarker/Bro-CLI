export function headlessBrowserEnvironment(input: {
  browserHostSuffix?: string;
  uni-cliUrl: string;
}): Record<string, string> {
  if (input.browserHostSuffix === undefined) return {};
  if (!/^\.[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(input.browserHostSuffix)) {
    throw new Error("Invalid headless browser host suffix.");
  }
  const target = new URL(input.uni-cliUrl);
  if (target.protocol !== "http:" || target.hostname !== "127.0.0.1" || !target.port) {
    throw new Error("Headless browser proxy must target the loopback runtime.");
  }
  return {
    UNICLI_DEV_BROWSER_HOST_SUFFIX: input.browserHostSuffix,
    UNICLI_DEV_UNICLI_PROXY_TARGET: target.origin,
    VITE_UNICLI_URL: "/api/uni-cli",
    VITE_UNICLI_PORT: "443",
    VITE_UNICLI_FORCE_MANUAL_AUTH: "1",
  };
}
