import fs from 'node:fs/promises'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'
import logger from '@wdio/logger'
import { Launcher } from '@wdio/cli'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
process.env.WDIO_UNIT_TESTS = '1'

const launcherTimeout = async () => {
    const output = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-launcher-timeout-'))
    const previous = Object.fromEntries(['WDIO_TIMEOUT_SCENARIO', 'WDIO_TIMEOUT_EVENTS', 'WDIO_TIMEOUT_OUTPUT']
        .map(key => [key, process.env[key]]))
    const scenarios = [
        { name: 'disabled', timeout: 0, expected: 0, bodies: [0] },
        { name: 'normal', timeout: 5000, expected: 0, bodies: [0] },
        { name: 'prepare', timeout: 150, prepare: 300, expected: 1, bodies: [], settle: 350 },
        { name: 'worker-hook', timeout: 150, workerHook: 300, expected: 1, bodies: [], settle: 350 },
        { name: 'service', timeout: 150, service: 600, expected: 1, bodies: [] },
        { name: 'serial', timeout: 1500, body: 2500, serial: true, expected: 1, bodies: [0] },
        { name: 'retry', timeout: 1500, retry: true, expected: 1, bodies: [0], settle: 3100 },
        { name: 'teardown', timeout: 1500, teardown: 2000, expected: 1, bodies: [0] }
    ]
    let logOffset = 0
    try {
        for (const scenario of scenarios) {
            const eventsFile = path.join(output, `${scenario.name}.jsonl`)
            await fs.writeFile(eventsFile, '')
            process.env.WDIO_TIMEOUT_SCENARIO = JSON.stringify(scenario)
            process.env.WDIO_TIMEOUT_EVENTS = eventsFile
            process.env.WDIO_TIMEOUT_OUTPUT = output
            const configPath = path.join(output, `${scenario.name}.conf.mjs`)
            const fixture = url.pathToFileURL(path.resolve(__dirname, 'wdio.conf.js')).href
            await fs.writeFile(configPath, `import { createConfig } from ${JSON.stringify(fixture)};\nexport const config = createConfig(${JSON.stringify(scenario)}, ${JSON.stringify(eventsFile)}, ${JSON.stringify(output)});\n`)
            const launcher = new Launcher(configPath, { strictSelectors: false })
            const code = await launcher.run()
            if (scenario.settle) { await sleep(scenario.settle) }
            const events = (await fs.readFile(eventsFile, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
            assert.strictEqual(code, scenario.expected, scenario.name)
            assert.deepStrictEqual(events.filter(event => event.event === 'body').map(event => event.index), scenario.bodies, scenario.name)
            assert.strictEqual(events.filter(event => event.event === 'complete').length, 1, scenario.name)
            assert.strictEqual(events.filter(event => event.event === 'completeDone').length, 1, scenario.name)
            if (scenario.name === 'prepare') {
                assert.strictEqual(events.filter(event => event.event === 'workerStart').length, 0)
            }
            if (scenario.name === 'worker-hook') {
                assert.strictEqual(events.filter(event => event.event === 'workerStart').length, 1)
                assert.strictEqual(events.filter(event => event.event === 'workerHookDone').length, 1)
            }
            if (scenario.name === 'service') {
                const ready = events.findIndex(event => event.event === 'serviceReady')
                const cleaned = events.findIndex(event => event.event === 'serviceCleanup')
                assert.ok(ready >= 0 && cleaned > ready)
                assert.strictEqual(events[cleaned].ready, true)
                assert.strictEqual(events.filter(event => event.event === 'serviceCleanup').length, 1)
            }
            if (scenario.name === 'retry') {
                assert.strictEqual(events.filter(event => event.event === 'workerStart').length, 1)
            }
            const logs = await fs.readFile(path.join(output, 'wdio.log'), 'utf8').catch(error => {
                if (error.code === 'ENOENT') { return '' }
                throw error
            })
            const diagnostics = logs.slice(logOffset).split('\n').filter(line => line.includes('Test run timed out after'))
            logOffset = logs.length
            assert.strictEqual(diagnostics.length, scenario.expected, scenario.name)
            if (scenario.expected) {
                assert.ok(diagnostics[0].includes(`Test run timed out after ${scenario.timeout}ms. Starting graceful shutdown.`))
                console.log(`launcherTimeout ${scenario.name} flushed diagnostic: ${diagnostics[0]}`)
            }
            console.log(`launcherTimeout ${scenario.name}: exit ${code}, bodies ${JSON.stringify(scenario.bodies)}`)
        }
    } catch (error) {
        for (const name of await fs.readdir(output)) {
            if (name.endsWith('.log') || name.endsWith('.jsonl')) {
                console.log(`launcherTimeout diagnostic ${name}:\n${await fs.readFile(path.join(output, name), 'utf8')}`)
            }
        }
        throw error
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) { delete process.env[key] } else { process.env[key] = value }
        }
        await logger.waitForBuffer()
        logger.clearLogger()
        await fs.rm(output, { recursive: true, force: true })
    }
}

try {
    await launcherTimeout()
    console.log('launcherTimeout child passed!')
    process.exit(0)
} catch (error) {
    console.error(error)
    process.exit(1)
}
