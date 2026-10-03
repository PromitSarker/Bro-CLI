import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BLANK_SLATE_FLAG = "--blank-slate";

export const BLANK_SLATE_PATH_ENV_KEYS = Object.freeze([
  "HOME",
  "USERPROFILE",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  "XDG_CACHE_HOME",
  "XDG_STATE_HOME",
  "APPDATA",
  "LOCALAPPDATA",
  "UNICLI_ELECTRON_USERDATA",
  "UNICLI_DESKTOP_BOOTSTRAP_PATH",
  "UNICLI_SERVER_CONFIG",
  "UNICLI_ENV_STORE",
  "UNICLI_TOKEN_STORE",
  "UNICLI_RUNTIME_DB",
  "UNICLI_DATA_DIR",
  "OPENCODE_CONFIG_DIR",
  "OPENCODE_DB",
]);

function pathApi(platform) {
  return platform === "win32" ? path.win32 : path.posix;
}

export function prepareBlankSlateProfile({
  argv,
  env = process.env,
  platform = process.platform,
  temporaryDirectory = tmpdir(),
  createTempRoot = (prefix) => mkdtempSync(prefix),
  createDirectory = (directory) => {
    mkdirSync(directory, { recursive: true });
  },
}) {
  if (!argv.includes(BLANK_SLATE_FLAG)) {
    return null;
  }

  const paths = pathApi(platform);
  const rootPath = createTempRoot(paths.join(temporaryDirectory, "uni-cli-test-profile-"));
  const userDataPath = paths.join(rootPath, "electron", "user-data");
  const homePath = paths.join(rootPath, "home");
  const uni-cliConfigPath = paths.join(rootPath, "uni-cli", "config");
  const opencodeDataPath = paths.join(rootPath, "opencode", "data");
  const environment = {
    HOME: homePath,
    USERPROFILE: homePath,
    XDG_CONFIG_HOME: paths.join(rootPath, "xdg", "config"),
    XDG_DATA_HOME: paths.join(rootPath, "xdg", "data"),
    XDG_CACHE_HOME: paths.join(rootPath, "xdg", "cache"),
    XDG_STATE_HOME: paths.join(rootPath, "xdg", "state"),
    APPDATA: paths.join(rootPath, "windows", "app-data", "roaming"),
    LOCALAPPDATA: paths.join(rootPath, "windows", "app-data", "local"),
    UNICLI_ELECTRON_USERDATA: userDataPath,
    UNICLI_DESKTOP_BOOTSTRAP_PATH: paths.join(uni-cliConfigPath, "desktop-bootstrap.json"),
    UNICLI_SERVER_CONFIG: paths.join(uni-cliConfigPath, "server.json"),
    UNICLI_ENV_STORE: paths.join(uni-cliConfigPath, "env.json"),
    UNICLI_TOKEN_STORE: paths.join(uni-cliConfigPath, "tokens.json"),
    UNICLI_RUNTIME_DB: paths.join(uni-cliConfigPath, "runtime.sqlite"),
    UNICLI_DATA_DIR: paths.join(rootPath, "uni-cli", "data"),
    OPENCODE_CONFIG_DIR: paths.join(rootPath, "opencode", "config"),
    OPENCODE_DB: paths.join(opencodeDataPath, "opencode.db"),
  };

  const directories = new Set([
    userDataPath,
    homePath,
    environment.XDG_CONFIG_HOME,
    environment.XDG_DATA_HOME,
    environment.XDG_CACHE_HOME,
    environment.XDG_STATE_HOME,
    environment.APPDATA,
    environment.LOCALAPPDATA,
    uni-cliConfigPath,
    environment.UNICLI_DATA_DIR,
    environment.OPENCODE_CONFIG_DIR,
    opencodeDataPath,
  ]);
  for (const directory of directories) createDirectory(directory);
  Object.assign(env, environment);

  return {
    rootPath,
    userDataPath,
    homePath,
    environment,
  };
}

// This module is the first import in main.mjs. Applying the overrides during
// dependency evaluation keeps module-load path constants and runtime children
// inside the same per-launch profile.
export const processBlankSlateProfile = prepareBlankSlateProfile({
  argv: process.argv,
});

export function resolveBlankSlateLaunch({ appName, profile }) {
  if (!profile) return { enabled: false, appName, userDataPath: null };
  return {
    enabled: true,
    appName: `${appName} - Test profile`,
    ...profile,
  };
}
