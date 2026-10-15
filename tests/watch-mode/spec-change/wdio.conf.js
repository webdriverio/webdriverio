import fs from 'node:fs'

const recordHook = (type, specs) => fs.appendFileSync(
    process.env.WDIO_WATCH_HOOKS,
    JSON.stringify({ type, cid: process.env.WDIO_WORKER_ID, specs }) + '\n'
)

class ShutdownService {
    afterSession(config, capabilities, specs) {
        recordHook('service', specs)
    }
}

export const config = {
    hostname: '127.0.0.1',
    port: Number(process.env.WDIO_WATCH_PORT),
    path: '/',
    capabilities: [{ browserName: 'chrome', 'wdio:enforceWebDriverClassic': true }],
    specs: [process.env.WDIO_WATCH_SPEC],
    framework: 'mocha',
    reporters: ['spec'],
    logLevel: 'error',
    connectionRetryCount: 0,
    connectionRetryTimeout: 5000,
    mochaOpts: { timeout: 5000 },
    services: [[ShutdownService]],
    afterSession(config, capabilities, specs) {
        recordHook('config', specs)
    },
    onWorkerEnd(cid, exitCode) {
        // Unlike a message from the spec, this includes framework teardown failures.
        process.send({ name: 'watch:run:end', cid, exitCode })
    }
}
