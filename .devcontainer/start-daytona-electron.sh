#!/usr/bin/env bash
set -euo pipefail

# Start the real Electron app in Daytona/headless Linux with CDP enabled.
# This centralizes the graphics-safe Chromium flags and optional secret-volume
# env loading used by Daytona evals.

cd "${UNICLI_WORKSPACE_DIR:-/workspace}"

if [ "${1:-}" = "--detach" ]; then
  shift
  SCRIPT_PATH="${BASH_SOURCE[0]}"
  LOG_PATH="${DAYTONA_ELECTRON_LOG:-/tmp/electron.log}"
  python3 - "$SCRIPT_PATH" "$LOG_PATH" "$@" <<'PY'
import os
import subprocess
import sys

script_path, log_path, *args = sys.argv[1:]
log = open(log_path, "ab", buffering=0)
subprocess.Popen(
    ["bash", script_path, *args],
    cwd=os.environ.get("UNICLI_WORKSPACE_DIR", "/workspace"),
    env=os.environ.copy(),
    stdin=subprocess.DEVNULL,
    stdout=log,
    stderr=subprocess.STDOUT,
    start_new_session=True,
    close_fds=True,
)
PY
  exit 0
fi

DAYTONA_SECRETS_ENV="${DAYTONA_SECRETS_ENV:-/daytona-secrets}"
DAYTONA_ELECTRON_EXTRA_LAUNCH_ARGS="${DAYTONA_ELECTRON_EXTRA_LAUNCH_ARGS:---disable-gpu --disable-dev-shm-usage --enable-unsafe-swiftshader}"

source_secret_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

if [ -d "$DAYTONA_SECRETS_ENV" ]; then
  shopt -s nullglob
  for env_file in "$DAYTONA_SECRETS_ENV"/*.env; do
    source_secret_env_file "$env_file"
  done
  shopt -u nullglob
elif [ -f "$DAYTONA_SECRETS_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$DAYTONA_SECRETS_ENV"
  set +a
fi

export DISPLAY="${DISPLAY:-:99}"
export ELECTRON_DISABLE_SANDBOX="${ELECTRON_DISABLE_SANDBOX:-1}"
export ELECTRON_EXTRA_LAUNCH_ARGS="${ELECTRON_EXTRA_LAUNCH_ARGS:-$DAYTONA_ELECTRON_EXTRA_LAUNCH_ARGS}"
export UNICLI_REACT_DEVTOOLS="${UNICLI_REACT_DEVTOOLS:-0}"
export UNICLI_DEV_MODE="${UNICLI_DEV_MODE:-1}"
export UNICLI_ELECTRON_REMOTE_DEBUG_PORT="${UNICLI_ELECTRON_REMOTE_DEBUG_PORT:-9825}"
export UNICLI_ELECTRON_FAKE_MEDIA="${UNICLI_ELECTRON_FAKE_MEDIA:-0}"
if [ -n "${UNICLI_ELECTRON_USERDATA:-}" ]; then
  export UNICLI_ELECTRON_USERDATA
fi
if [ -n "${UNICLI_ELECTRON_APP_IDENTIFIER:-}" ]; then
  export UNICLI_ELECTRON_APP_IDENTIFIER
fi
if [ -n "${UNICLI_ELECTRON_APP_NAME:-}" ]; then
  export UNICLI_ELECTRON_APP_NAME
fi

if [ -n "${UNICLI_EVAL_ELECTRON_BINARY:-}" ]; then
  if [ ! -x "$UNICLI_EVAL_ELECTRON_BINARY" ]; then
    echo "UNICLI_EVAL_ELECTRON_BINARY is not an executable file: $UNICLI_EVAL_ELECTRON_BINARY" >&2
    exit 1
  fi
  exec "$UNICLI_EVAL_ELECTRON_BINARY"
fi

exec pnpm --filter @uni-cli/desktop dev:electron
