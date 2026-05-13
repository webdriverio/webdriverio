/**
 * Worker-side shim for the integration test. Reads a fixed set of env vars
 * and writes them to stdout as a single-line JSON blob, then exits.
 *
 * The integration test forks this script via DisplayProcessFactory and asserts
 * that the daemon env merged in DisplayProcessFactory propagates into the
 * forked child's process.env.
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
