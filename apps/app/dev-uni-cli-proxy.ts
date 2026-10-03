interface Devuni-cliProxyOptions {
  target: string;
  changeOrigin: boolean;
  ws: boolean;
  rewrite: (path: string) => string;
}

export function devuni-cliProxy(env: NodeJS.ProcessEnv): Record<string, Devuni-cliProxyOptions> {
  if (env.UNICLI_DEV_MODE !== "1" || !env.UNICLI_DEV_UNICLI_PROXY_TARGET) return {};
  const target = new URL(env.UNICLI_DEV_UNICLI_PROXY_TARGET);
  if (target.protocol !== "http:" || target.hostname !== "127.0.0.1" || !target.port
    || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("Invalid development-only Uni-CLI proxy configuration.");
  }
  return {
    "/api/uni-cli": {
      target: target.origin,
      changeOrigin: true,
      ws: true,
      rewrite: (path: string) => path.replace(/^\/api\/uni-cli(?=\/|\?|$)/, "") || "/",
    },
  };
}
