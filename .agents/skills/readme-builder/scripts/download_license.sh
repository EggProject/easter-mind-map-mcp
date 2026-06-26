#!/usr/bin/env bash
#
# download_license.sh — bash fallback for download_license.py.
#
# Use this when python3 is not available. The Python script is the
# primary tool; this is a minimal fallback that uses curl + jq (or
# sed/grep) to do the same job.
#
# Usage:
#   ./download_license.sh --spdx MIT --year 2026 --name "Jane Developer"
#
# Requires: curl, jq (optional but recommended). If jq is missing,
# the script falls back to a sed/awk extract of the body field,
# which is fragile — prefer installing jq.

set -euo pipefail

GITHUB_API="https://api.github.com/licenses"

# Default values
SPDX=""
YEAR="$(date +%Y)"
NAME=""
OUT="LICENSE"
META_OUT=".license-meta.json"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --spdx)  SPDX="$2";  shift 2;;
    --year)  YEAR="$2";  shift 2;;
    --name)  NAME="$2";  shift 2;;
    --out)   OUT="$2";   shift 2;;
    --meta)  META_OUT="$2"; shift 2;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 64
      ;;
  esac
done

if [[ -z "$SPDX" || -z "$NAME" ]]; then
  echo "ERROR: --spdx and --name are required." >&2
  exit 64
fi

# Fetch the license JSON. Use a 30-second timeout to avoid hanging.
JSON="$(curl --silent --show-error --fail-with-body \
  --max-time 30 \
  -H "User-Agent: readme-builder-skill/1.0" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "${GITHUB_API}/${SPDX}" \
  || {
    rc=$?
    echo "ERROR: curl failed (exit ${rc}). Is the network up? Is api.github.com reachable?" >&2
    exit 1
  })"

# Extract the body field. Prefer jq; fall back to a sed-based extract.
if command -v jq >/dev/null 2>&1; then
  BODY="$(printf '%s' "$JSON" | jq -r '.body')"
  CANONICAL_URL="$(printf '%s' "$JSON" | jq -r '.url')"
else
  echo "WARN: jq not installed; falling back to a fragile text extract." >&2
  # Extract everything between the first "body": " and the closing
  # unescaped quote at the end of the JSON object. This is brittle —
  # install jq.
  BODY="$(printf '%s' "$JSON" \
    | sed -n '/"body":/,$p' \
    | tail -n +2 \
    | sed '$d' \
    | sed 's/^"//; s/"$//' \
    | sed 's/\\n/\n/g; s/\\"/"/g; s/\\\\/\\/g')"
  CANONICAL_URL="${GITHUB_API}/${SPDX}"
fi

if [[ -z "$BODY" || "$BODY" == "null" ]]; then
  echo "ERROR: SPDX id '${SPDX}' is not a known license on GitHub's API." >&2
  echo "Check the spelling, or pick from: MIT, Apache-2.0, GPL-3.0, BSD-3-Clause." >&2
  exit 2
fi

# Substitute [year] / [fullname] placeholders.
BODY="$(printf '%s' "$BODY" \
  | sed -e "s/\[year\]/${YEAR}/g" \
        -e "s/\[yyyy\]/${YEAR}/g" \
        -e "s/\[year of copyright\]/${YEAR}/g" \
        -e "s/\[fullname\]/${NAME}/g" \
        -e "s/\[name of copyright owner\]/${NAME}/g" \
        -e "s/\[name of copyright holder\]/${NAME}/g" \
        -e "s/\[copyright holder\]/${NAME}/g" \
        -e "s/\[owner\]/${NAME}/g")"

# Write LICENSE atomically.
printf '%s\n' "$BODY" > "${OUT}.tmp"
mv "${OUT}.tmp" "${OUT}"

# Write .license-meta.json sidecar. Use a stable, minimal format.
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "${META_OUT}.tmp" <<EOF
{
  "spdx_id": "${SPDX}",
  "year": ${YEAR},
  "copyright_holder": "${NAME}",
  "downloaded_at": "${TIMESTAMP}",
  "source_url": "${CANONICAL_URL}"
}
EOF
mv "${META_OUT}.tmp" "${META_OUT}"

echo "✓ Wrote ${OUT} (${SPDX}, ${YEAR}, ${NAME})"
echo "✓ Wrote ${META_OUT} (sidecar with badge color and metadata)"
