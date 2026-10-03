import { mkdir, writeFile } from "node:fs/promises";
import { launchHeadlessWeb } from "/workspace/packages/world/src/headless-web.ts";

const root = "/opt/uni-cli-preview/state";
for (const dir of ["home", "cache", "config/uni-cli", "config/opencode", "data/uni-cli", "data/opencode", "workspace"]) {
  await mkdir(`${root}/${dir}`, { recursive: true });
}
const runtime = await launchHeadlessWeb({
  repoRoot: "/workspace", name: "freestyle-preview", state: "isolated",
  workspace: `${root}/workspace`, browserHostSuffix: ".preview.uniCli.software",
  env: {
    PATH: process.env.PATH,
    // Dependencies were verified before snapshotting; changing HOME must not trigger a reinstall.
    pnpm_config_verify_deps_before_run: "false",
    HOME: `${root}/home`, XDG_CONFIG_HOME: `${root}/config`, XDG_DATA_HOME: `${root}/data`, XDG_CACHE_HOME: `${root}/cache`,
    UNICLI_DATA_DIR: `${root}/data/uni-cli`, UNICLI_ENV_STORE: `${root}/config/uni-cli/env.json`,
    UNICLI_SERVER_STATE_PATH: `${root}/data/uni-cli/server-state.json`,
    UNICLI_SERVER_TOKEN_STORE_PATH: `${root}/data/uni-cli/server-tokens.json`,
    OPENCODE_CONFIG_DIR: `${root}/config/opencode`, OPENCODE_DB: `${root}/data/opencode/opencode.db`,
    UNICLI_DEV_HEADLESS_WEB_DEN_PROXY: "1", UNICLI_DEV_DEN_PROXY_TARGET: "https://app.uniClilabs.com", VITE_DISABLE_UNICLI_MODELS: "0",
    VITE_UNICLI_POSTHOG_KEY: "", VITE_UNICLI_SENTRY_DSN: "",
    UNICLI_PORT: "8778", UNICLI_WEB_PORT: "5178", HOST: "127.0.0.1", VITE_HOST: "127.0.0.1",
  },
});
await writeFile("/opt/uni-cli-preview/services.json", JSON.stringify({ app: runtime.manifest.webUrl, engine: runtime.manifest.uniCliUrl }), { mode: 0o600 });
await writeFile("/opt/uni-cli-preview/outputs.json", JSON.stringify({
  uniCliToken: { value: runtime.manifest.token, secret: true, group: "Uni-CLI" },
  uniCliHostToken: { value: runtime.manifest.hostToken, secret: true, group: "Uni-CLI" },
}), { mode: 0o600 });
await runtime.detach();
