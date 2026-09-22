export const config = {
    hostname: '127.0.0.1',
    port: Number(process.env.WDIO_WATCH_PORT),
    path: '/',
    capabilities: [{ browserName: 'chrome', 'wdio:enforceWebDriverClassic': true }],
    specs: [process.env.WDIO_WATCH_SPEC],
    filesToWatch: [process.env.WDIO_WATCH_FILE],
    framework: 'mocha',
    reporters: ['spec'],
    logLevel: 'error',
    connectionRetryCount: 0,
    connectionRetryTimeout: 5000,
    mochaOpts: { timeout: 5000 },
    onWorkerEnd(cid, exitCode) {
        process.send({ name: 'watch:run:end', cid, exitCode })
    }
}
