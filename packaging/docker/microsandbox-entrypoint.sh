#!/usr/bin/env sh
set -eu

UNICLI_WORKSPACE="${UNICLI_WORKSPACE:-/workspace}"
UNICLI_DATA_DIR="${UNICLI_DATA_DIR:-/data/uni-cli-server}"
UNICLI_SIDECAR_DIR="${UNICLI_SIDECAR_DIR:-/data/sidecars}"
UNICLI_PORT="${UNICLI_PORT:-8787}"
UNICLI_TOKEN="${UNICLI_TOKEN:-microsandbox-token}"
UNICLI_HOST_TOKEN="${UNICLI_HOST_TOKEN:-microsandbox-host-token}"
UNICLI_APPROVAL_MODE="${UNICLI_APPROVAL_MODE:-auto}"
UNICLI_CORS_ORIGINS="${UNICLI_CORS_ORIGINS:-*}"
UNICLI_CONNECT_HOST="${UNICLI_CONNECT_HOST:-127.0.0.1}"
UNICLI_EXTENSIONS_PLUGIN_DIR="${UNICLI_EXTENSIONS_PLUGIN_DIR:-/opt/uni-cli/opencode-plugins}"
HOME="${HOME:-/root}"
USER="${USER:-root}"
SHELL="${SHELL:-/bin/sh}"
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"

if [ "$HOME" = "/" ]; then
  HOME=/root
  XDG_CONFIG_HOME="$HOME/.config"
  XDG_CACHE_HOME="$HOME/.cache"
  XDG_DATA_HOME="$HOME/.local/share"
  XDG_STATE_HOME="$HOME/.local/state"
fi

export HOME USER SHELL XDG_CONFIG_HOME XDG_CACHE_HOME XDG_DATA_HOME XDG_STATE_HOME
export UNICLI_DATA_DIR UNICLI_TOKEN UNICLI_HOST_TOKEN UNICLI_EXTENSIONS_PLUGIN_DIR
export UNICLI_MANAGE_OPENCODE=1
export UNICLI_OPENCODE_BIN=/usr/local/bin/opencode

mkdir -p "$UNICLI_WORKSPACE" "$UNICLI_DATA_DIR" "$UNICLI_SIDECAR_DIR"
mkdir -p "$HOME" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$XDG_DATA_HOME" "$XDG_STATE_HOME"

printf '%s\n' "Starting Uni-CLI micro-sandbox"
printf '%s\n' "- workspace: $UNICLI_WORKSPACE"
printf '%s\n' "- home: $HOME"
printf '%s\n' "- uni-cli url: http://$UNICLI_CONNECT_HOST:$UNICLI_PORT"
printf '%s\n' "- client token: $UNICLI_TOKEN"
printf '%s\n' "- host token: $UNICLI_HOST_TOKEN"
printf '%s\n' "- health: curl http://$UNICLI_CONNECT_HOST:$UNICLI_PORT/health"
printf '%s\n' "- auth test: curl -H \"Authorization: Bearer $UNICLI_TOKEN\" http://$UNICLI_CONNECT_HOST:$UNICLI_PORT/workspaces"

exec uni-cli-server \
  --workspace "$UNICLI_WORKSPACE" \
  --host 0.0.0.0 \
  --port "$UNICLI_PORT" \
  --token "$UNICLI_TOKEN" \
  --host-token "$UNICLI_HOST_TOKEN" \
  --approval "$UNICLI_APPROVAL_MODE" \
  --cors "$UNICLI_CORS_ORIGINS" \
  --verbose
