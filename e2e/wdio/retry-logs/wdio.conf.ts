import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as base } from '../wdio.conf.js'

const ownsOutputDir = !process.env.WDIO_RETRY_LOG_OUTPUT
const chromedriverOptions = { binary: process.env.CHROMEDRIVER_BINARY, verbose: true }
const outputDir = process.env.WDIO_RETRY_LOG_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-real-retry-logs-'))
const snapshots: { worker: Buffer, driver: Buffer }[] = []

export const config: WebdriverIO.Config = {
    ...base,
    rootDir: fileURLToPath(new URL('../../', import.meta.url)),
    specs: [fileURLToPath(new URL('./retry.e2e.ts', import.meta.url))],
    outputDir,
    maxInstances: 1,
    bail: 0,
    logLevel: 'trace',
    specFileRetries: 1,
    specFileRetriesDelay: 0,
    specFileRetriesDeferred: false,
    runnerEnv: { WDIO_RETRY_LOG_OUTPUT: outputDir, WDIO_RETRY_LOG_COUNTER: path.join(outputDir, 'counter') },
    mochaOpts: { ...base.mochaOpts, retries: 0 },
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: false,
        'wdio:enforceWebDriverClassic': true,
        'wdio:chromedriverOptions': chromedriverOptions,
        'goog:chromeOptions': { binary: process.env.CHROME_BINARY, args: ['--headless=new', '--disable-gpu'] }
    }],
    onWorkerEnd(cid) {
        assert.equal(cid, '0-0')
        const suffix = snapshots.length ? `-${snapshots.length}` : ''
        snapshots.push({
            worker: fs.readFileSync(path.join(outputDir, `retry.e2e-0-0${suffix}.log`)),
            driver: fs.readFileSync(path.join(outputDir, `wdio-0-0${suffix}-chromedriver.log`))
        })
    },
    onComplete(exitCode) {
        assert.equal(exitCode, 0)
        assert.equal(snapshots.length, 2)
        for (const [attempt, snapshot] of snapshots.entries()) {
            const suffix = attempt ? `-${attempt}` : ''
            for (const [kind, filename] of [
                ['worker', `retry.e2e-0-0${suffix}.log`],
                ['driver', `wdio-0-0${suffix}-chromedriver.log`]
            ] as const) {
                assert.deepEqual(fs.readFileSync(path.join(outputDir, filename)), snapshot[kind])
                assert.ok(snapshot[kind].includes(`REAL_DRIVER_LOG_ATTEMPT_${attempt + 1}`))
                assert.ok(!snapshot[kind].includes(`REAL_DRIVER_LOG_ATTEMPT_${2 - attempt}`))
            }
        }
        assert.ok(fs.existsSync(path.join(outputDir, 'wdio.log')))
        console.log('Real Chrome retry logs: 2 attempts, same CID, worker and driver bytes preserved')
        if (ownsOutputDir) {
            fs.rmSync(outputDir, { recursive: true, force: true })
        }
    }
}
