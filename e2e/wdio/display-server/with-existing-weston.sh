#!/usr/bin/env bash
# Runs a command against a Weston that WebdriverIO doesn't start.
set -euo pipefail

XDG_RUNTIME_DIR=$(mktemp -d)
export XDG_RUNTIME_DIR
socket=wayland-existing

weston_pid=
cleanup() {
    if [ -n "$weston_pid" ]; then
        kill "$weston_pid" 2>/dev/null || true
        wait "$weston_pid" 2>/dev/null || true
    fi
    rm -rf "$XDG_RUNTIME_DIR"
}
trap cleanup EXIT

log_dir="$(dirname "$0")/logs"
mkdir -p "$log_dir"
weston --backend=headless --renderer=pixman --idle-time=0 --no-config --socket="$socket" >"$log_dir/weston-existing.log" 2>&1 &
weston_pid=$!

for _ in $(seq 1 50); do
    [ -S "$XDG_RUNTIME_DIR/$socket" ] && break
    if ! kill -0 "$weston_pid" 2>/dev/null; then
        echo "Weston exited; see $log_dir/weston-existing.log" >&2
        exit 1
    fi
    sleep 0.2
done
if [ ! -S "$XDG_RUNTIME_DIR/$socket" ]; then
    echo "Weston did not create $XDG_RUNTIME_DIR/$socket" >&2
    exit 1
fi

export WAYLAND_DISPLAY="$socket"
export XDG_SESSION_TYPE=tty # as over SSH, which the runner must overwrite
unset DISPLAY GDK_BACKEND ELECTRON_OZONE_PLATFORM_HINT
"$@"
