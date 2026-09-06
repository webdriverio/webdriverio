/**
 * Worker-side shim for the integration test: reads a fixed set of env vars,
 * writes them to stdout as one-line JSON, then exits. The test forks it after
 * startDisplayDaemonFromConfig and asserts the daemon env propagated to the child.
 */
const data = JSON.stringify({
    WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY ?? null,
    XDG_RUNTIME_DIR: process.env.XDG_RUNTIME_DIR ?? null,
    ELECTRON_OZONE_PLATFORM_HINT: process.env.ELECTRON_OZONE_PLATFORM_HINT ?? null,
    DISPLAY: process.env.DISPLAY ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
})
process.stdout.write(data + '\n')
process.exit(0)
