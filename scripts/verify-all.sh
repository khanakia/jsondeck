#!/usr/bin/env bash
# Runs every headless suite against the built dist/ twice: over http (scripts/serve.mjs
# on a spare local port) and from file://. The row-height, scrollbar and no-shadow
# audits run inside verify.mjs / verify-m3.mjs / verify-docs.mjs. Exits non-zero
# if any suite fails. If Chromium is missing system libraries, point LD_LIBRARY_PATH at them.
#   scripts/verify-all.sh            (both)      scripts/verify-all.sh http|file
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
MODE="${1:-both}"
PORT="${VERIFY_PORT:-4319}"
fail=0

run_suites() { # $1 = base URL ending in /
	local b="$1" tag="$2"
	node scripts/verify.mjs "${b}demo/tabs.html" "shots/${tag}-run" || fail=1
	node scripts/verify-m3.mjs "${b}demo/index.html" "shots/${tag}-m3" || fail=1
	node scripts/verify-docs.mjs "${b}docs/index.html" "shots/${tag}-docs" || fail=1
	node scripts/verify-viz.mjs "${b}demo/viz.html" "shots/${tag}-viz" || fail=1
	node scripts/verify-cdn.mjs "${b}" "shots/${tag}-cdn" || fail=1
}

if [[ "$MODE" == both || "$MODE" == http ]]; then
	PORT="$PORT" node scripts/serve.mjs >shots/verify-serve.log 2>&1 &
	srv=$!
	trap 'kill $srv 2>/dev/null' EXIT
	# Wait until the server answers (a fixed sleep raced it once and every suite after the first got "connection refused").
	for _ in $(seq 1 50); do node -e "fetch('http://127.0.0.1:${PORT}/').then(()=>process.exit(0),()=>process.exit(1))" && break; sleep 0.2; done
	kill -0 $srv 2>/dev/null || { echo "verify-all: the test server did not start (is port ${PORT} taken? set VERIFY_PORT)"; exit 1; }
	echo "=== http://127.0.0.1:${PORT}/"
	run_suites "http://127.0.0.1:${PORT}/" http
fi
if [[ "$MODE" == both || "$MODE" == file ]]; then
	echo "=== file://${ROOT}/"
	run_suites "file://${ROOT}/" file
fi
[[ $fail == 0 ]] && echo "verify-all: ALL PASSED" || echo "verify-all: FAILURES (see above)"
exit $fail
