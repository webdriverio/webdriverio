/**
 * Fake `weston` for the real-process tests. WDIO_STUB_MODE picks the behavior:
 * - 'ready' (default): create the socket the parent polls for, then idle until
 *   signaled, exiting cleanly on SIGTERM/SIGINT.
 * - 'ignore-sigterm': create the socket and idle, but swallow SIGTERM so the
 *   caller must escalate to SIGKILL. Each swallowed SIGTERM is appended to the
 *   file in WDIO_STUB_SIGNAL_LOG, if set.
 * - 'crash': write to stderr and exit non-zero without creating the socket.
 */
import fs from 'node:fs'
import path from 'node:path'

const mode = process.env.WDIO_STUB_MODE || 'ready'
const signalLog = process.env.WDIO_STUB_SIGNAL_LOG
const socketArg = process.argv.find((arg) => arg.startsWith('--socket='))
const socketName = socketArg?.slice('--socket='.length)
const runtimeDir = process.env.XDG_RUNTIME_DIR

if (mode === 'crash') {
    fs.writeSync(2, 'weston: fatal: simulated startup failure\n') // synchronous, so the line is written before the immediate exit
    process.exit(1)
} else {
    // Keep the event loop alive so the process idles until signalled.
    const keepAlive = setInterval(() => {}, 1 << 30)
    const quit = () => {
        clearInterval(keepAlive)
        process.exit(0)
    }

    // Install the handlers before the socket exists: the parent resolves startDaemon()
    // as soon as it sees the socket, so a stop() right after must find them in place.
    // Otherwise an early SIGTERM takes Node's default action and ends the stub at once.
    process.on('SIGINT', quit)
    if (mode === 'ignore-sigterm') {
        process.on('SIGTERM', () => { // swallow → caller must SIGKILL
            if (signalLog) {
                fs.appendFileSync(signalLog, 'SIGTERM\n')
            }
        })
    } else {
        process.on('SIGTERM', quit)
    }

    if (socketName && runtimeDir) {
        fs.writeFileSync(path.join(runtimeDir, socketName), '')
    }
}
