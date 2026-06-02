#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

node_major() {
  "$1" -e "console.log(Number(process.versions.node.split('.')[0]))" 2>/dev/null || echo 0
}

NODE_BIN=""
if command -v node >/dev/null 2>&1 && [ "$(node_major "$(command -v node)")" -ge 22 ]; then
  NODE_BIN="$(command -v node)"
elif [ -x "$CODEX_NODE" ] && [ "$(node_major "$CODEX_NODE")" -ge 22 ]; then
  NODE_BIN="$CODEX_NODE"
else
  echo "Capacitor 8 requires Node >=22. Install Node 22+ and rerun." >&2
  exit 1
fi

exec "$NODE_BIN" "$ROOT_DIR/node_modules/@capacitor/cli/bin/capacitor" "$@"
