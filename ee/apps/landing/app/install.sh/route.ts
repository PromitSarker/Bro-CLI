// GET /install.sh
//
// A small, inspectable, self-contained installer. It downloads the
// uni-cli-bootstrap CLI (a single dependency-free Node file served from this
// site) and installs it as the `uni-cli-bootstrap` command on the user's PATH.
//
// It is intentionally named `uni-cli-bootstrap` so setup guides can refer to a
// specific bootstrap command. It does not use npm or npx.
//
// This does NOT install the Uni-CLI desktop app. The script header and final
// output say so and print the app install commands, because agents asked to
// "install Uni-CLI" otherwise reach for this URL.
//
// Usage (the docs tell users to download + inspect before running):
//   curl -fsSLo /tmp/uni-cli-install.sh https://uniClilabs.com/install.sh
//   less /tmp/uni-cli-install.sh
//   sh /tmp/uni-cli-install.sh
export const dynamic = "force-static";

const installScript = `#!/usr/bin/env sh
# Uni-CLI bootstrap installer.
# Installs the \`uni-cli-bootstrap\` command (org setup CLI for agents) into a
# user-writable bin dir. No admin privileges, no npm, no npx. Requires Node.js 20+.
#
# This does NOT install the Uni-CLI desktop app. To install the app:
#   macOS:   brew install --cask uniCli
#   Any OS:  https://uniClilabs.com/download
#            (direct: https://uniClilabs.com/download/<mac-arm64|mac-x64|win-x64|win-arm64|linux-x64|linux-arm64>)
#   Or, after this script: uni-cli-bootstrap install app --manifest https://uniClilabs.com/install-manifest.json
# Agent setup guide: https://uniClilabs.com/start.md
set -eu

echo "Installing the uni-cli-bootstrap CLI (org setup for agents)."
echo "This does not install the Uni-CLI desktop app; see the end of this script's output."

CLI_URL="\${UNICLI_BOOTSTRAP_CLI_URL:-https://uniClilabs.com/uni-cli-bootstrap.mjs}"
BIN_DIR="\${UNICLI_BIN_DIR:-$HOME/.local/bin}"
INSTALL_DIR="\${UNICLI_INSTALL_DIR:-$HOME/.uni-cli/bootstrap}"

if ! command -v node >/dev/null 2>&1; then
  echo "uni-cli-bootstrap requires Node.js 20+ (node not found on PATH)." >&2
  echo "Install Node from https://nodejs.org/ and re-run this script." >&2
  exit 1
fi

NODE_MAJOR="$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))' 2>/dev/null || echo 0)"
if [ "\${NODE_MAJOR:-0}" -lt 20 ]; then
  echo "uni-cli-bootstrap requires Node.js 20+ (found $(node --version 2>/dev/null))." >&2
  exit 1
fi

if command -v curl >/dev/null 2>&1; then
  DOWNLOAD="curl -fsSL"
elif command -v wget >/dev/null 2>&1; then
  DOWNLOAD="wget -qO-"
else
  echo "uni-cli-bootstrap installer requires curl or wget." >&2
  exit 1
fi

mkdir -p "$BIN_DIR" "$INSTALL_DIR"

TMP_CLI="$(mktemp "\${TMPDIR:-/tmp}/uni-cli-bootstrap.XXXXXX.mjs")"
trap 'rm -f "$TMP_CLI"' EXIT

echo "Downloading uni-cli-bootstrap CLI from $CLI_URL ..."
# shellcheck disable=SC2086
$DOWNLOAD "$CLI_URL" > "$TMP_CLI"

if [ ! -s "$TMP_CLI" ]; then
  echo "Download failed or produced an empty file." >&2
  exit 1
fi
chmod 0755 "$TMP_CLI"

node "$TMP_CLI" install --source "$TMP_CLI" --install-dir "$INSTALL_DIR" --bin-dir "$BIN_DIR" --json

echo
echo "Installed uni-cli-bootstrap into $BIN_DIR."
echo "If 'uni-cli-bootstrap' is not found, add $BIN_DIR to your PATH:"
echo "  export PATH=$BIN_DIR"':$PATH'
echo
echo "Verify with:"
echo "  uni-cli-bootstrap doctor --json"
echo
echo "The Uni-CLI desktop app is installed separately:"
echo "  macOS:   brew install --cask uni-cli"
echo "  Any OS:  https://uniClilabs.com/download"
echo "  Or:      uni-cli-bootstrap install app --manifest https://uniClilabs.com/install-manifest.json"
echo "Agent setup guide: https://uniClilabs.com/start.md"
`;

export function GET() {
  return new Response(installScript, {
    headers: {
      "content-type": "text/x-shellscript; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
