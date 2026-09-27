/**
 * Fake `weston` for the real-process tests. WDIO_STUB_MODE picks the behavior:
 * - 'ready' (default): create the socket the parent polls for, then idle until
 *   signaled, exiting cleanly on SIGTERM/SIGINT.
 * - 'ignore-sigterm': create the socket and idle, but swallow SIGTERM so the
 *   caller must escalate to SIGKILL.
 * - 'crash': write to stderr and exit non-zero without creating the socket.
 */
import fs from 'node:fs'
import path from 'node:path'

const mode = process.env.WDIO_STUB_MODE || 'ready'
const socketArg = process.argv.find((arg) => arg.startsWith('--socket='))
const socketName = socketArg?.slice('--socket='.length)
const runtimeDir = process.env.XDG_RUNTIME_DIR

if (mode === 'crash') {
    process.stderr.write('weston: fatal: simulated startup failure\n')
    // Delay the exit a touch so the parent reliably receives the stderr 'data'
    // before the 'exit' event — the capture reads stderr at exit time.
    setTimeout(() => process.exit(1), 50)
} else {
    if (socketName && runtimeDir) {
        fs.writeFileSync(path.join(runtimeDir, socketName), '')
    }

    // Keep the event loop alive so the process idles until signalled.
    const keepAlive = setInterval(() => {}, 1 << 30)
    const quit = () => {
        clearInterval(keepAlive)
        process.exit(0)
    }

    process.on('SIGINT', quit)
    if (mode === 'ignore-sigterm') {
        process.on('SIGTERM', () => { /* swallow → caller must SIGKILL */ })
    } else {
        process.on('SIGTERM', quit)
    }
}
