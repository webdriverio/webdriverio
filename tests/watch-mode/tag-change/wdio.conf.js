import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))

export const config = {
    hostname: '127.0.0.1',
    port: Number(process.env.WDIO_WATCH_PORT),
    path: '/',
    capabilities: [{ browserName: 'chrome', 'wdio:enforceWebDriverClassic': true }],
    specs: [path.join(process.env.WDIO_WATCH_DIR, '*.feature')],
    framework: 'cucumber',
    reporters: ['spec'],
    logLevel: 'error',
    connectionRetryCount: 0,
    connectionRetryTimeout: 5000,
    cucumberOpts: {
        tags: '@wanted',
        require: [path.join(directory, 'steps.js')]
    },
    onWorkerEnd(cid, exitCode) {
        process.send({ name: 'watch:run:end', cid, exitCode })
    }
}
