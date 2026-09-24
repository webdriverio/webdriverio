/**
 * Fake `Xvfb` for the real-process tests. WDIO_STUB_MODE picks the behavior:
 * - 'ready' (default): write a display number to the `-displayfd` descriptor
 *   and close it, like the real server, then idle until signaled.
 * - 'crash': write to stderr and exit non-zero without reporting a display.
 */
import fs from 'node:fs'

const mode = process.env.WDIO_STUB_MODE || 'ready'

if (mode === 'crash') {
    process.stderr.write('Xvfb: fatal: simulated startup failure\n')
    setTimeout(() => process.exit(1), 50) // lets the parent receive the stderr data before the exit event
} else {
    const fdIndex = process.argv.indexOf('-displayfd')
    if (fdIndex !== -1) {
        const fd = Number(process.argv[fdIndex + 1])
        fs.writeSync(fd, '107\n')
        fs.closeSync(fd)
    }

    const keepAlive = setInterval(() => {}, 1 << 30) // idles until signaled
    const quit = () => {
        clearInterval(keepAlive)
        process.exit(0)
    }
    process.on('SIGINT', quit)
    process.on('SIGTERM', quit)
}
