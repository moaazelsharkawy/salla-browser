#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
ADMIN="$ROOT/src/pages/Admin.tsx"

if [[ ! -f "$ADMIN" ]]; then
  echo "Admin.tsx not found at $ADMIN" >&2
  exit 1
fi

python3 - "$ADMIN" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
text = text.replace('Sparkles', 'Flame')
path.write_text(text)
PY

if grep -RIn --include='*.ts' --include='*.tsx' -E '\bSparkles\b|<Sparkles' "$ROOT/src" >/tmp/salla-v015-sparkles.txt; then
  echo "Sparkles icon is still referenced:" >&2
  cat /tmp/salla-v015-sparkles.txt >&2
  exit 1
fi

echo "v015 UI icon cleanup applied successfully"
