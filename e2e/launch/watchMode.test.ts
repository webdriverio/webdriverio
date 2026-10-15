import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fork, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { setTimeout as sleep } from 'node:timers/promises'
import { test } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))
const execFileAsync = promisify(execFile)
type Run = { cid: string, exitCode: number }
type Session = { sessionId: string, port: number, capabilities: WebdriverIO.Capabilities }
type SessionEvent = { type: 'session', cid: string, sessions: Session[] }
type HookEvent = { type: 'config' | 'service', cid: string, specs: string[] }

test.each(['single', 'multi', 'parallel'].flatMap(mode => ['classic', 'bidi'].map(protocol => ({ mode, protocol }))))(
    '$mode watch keeps $protocol sessions alive across workers and closes them with hooks',
    async ({ mode, protocol }) => {
        const prefix = 'wdio-real-watch-'
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
        const configPath = path.join(directory, 'wdio.conf.mjs')
        const specPath = path.join(directory, 'watch.test.mjs')
        const watchedPath = path.join(directory, 'watched.txt')
        const eventPath = path.join(directory, 'events.jsonl')
        const workerCount = mode === 'parallel' ? 2 : 1
        const caps = {
            browserName: 'chrome',
            ...(protocol === 'classic' ? { 'wdio:enforceWebDriverClassic': true } : { webSocketUrl: true }),
            'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] }
        }
        const multiCaps = { first: { capabilities: caps }, second: { capabilities: caps } }
        const capabilities = mode === 'single' ? [caps] : mode === 'parallel' ? [multiCaps, multiCaps] : multiCaps
        await fs.writeFile(eventPath, '')
        await fs.writeFile(watchedPath, 'initial')
        await fs.writeFile(configPath, `
import fs from 'node:fs'
const record = event => fs.appendFileSync(${JSON.stringify(eventPath)}, JSON.stringify(event) + '\\n')
class ShutdownService {
    afterSession(config, capabilities, specs) { record({ type: 'service', cid: process.env.WDIO_WORKER_ID, specs }) }
}
export const config = {
    capabilities: ${JSON.stringify(capabilities)}, specs: [${JSON.stringify(specPath)}],
    filesToWatch: [${JSON.stringify(watchedPath)}], outputDir: ${JSON.stringify(directory)},
    framework: 'mocha', reporters: ['spec'], logLevel: 'error', services: [[ShutdownService]],
    connectionRetryCount: 0, connectionRetryTimeout: 10000, mochaOpts: { timeout: 15000 },
    before(capabilities, specs, browser) {
        const instances = browser.isMultiRemote ? browser.instances.map(name => browser.getInstance(name)) : [browser]
        record({ type: 'session', cid: process.env.WDIO_WORKER_ID, sessions: instances.map(instance => ({
            sessionId: instance.sessionId, port: instance.options.port, capabilities: instance.capabilities
        })) })
    },
    afterSession(config, capabilities, specs) { record({ type: 'config', cid: process.env.WDIO_WORKER_ID, specs }) },
    onWorkerEnd(cid, exitCode) { process.send?.({ type: 'run:end', cid, exitCode }) }
}
`)
        const spec = (phase: number, failing = false) => `
import assert from 'node:assert/strict'
describe('watch lifecycle', () => {
    it('preserves state in every original browser', async () => {
        const instances = browser.isMultiRemote ? browser.instances.map(name => browser.getInstance(name)) : [browser]
        for (const instance of instances) {
            ${phase > 1 ? "assert.equal(await instance.execute(() => window.watchState), 'persisted')" : ''}
            await instance.url('data:text/html,<title>Watch ${phase}</title>')
            await instance.execute(() => { window.watchState = 'persisted' })
            assert.equal(await instance.getTitle(), ${JSON.stringify(failing ? 'Wrong title' : `Watch ${phase}`)})
        }
    })
})
`
        await fs.writeFile(specPath, spec(1))
        let output = ''
        let closed = false
        let spawnError: Error | undefined
        const runs: Run[] = []
        const child = fork(path.join(root, 'packages/wdio-cli/bin/wdio.js'), ['run', configPath, '--watch'], {
            cwd: path.join(root, 'e2e'), execArgv: [], silent: true, windowsHide: true,
            detached: process.platform !== 'win32',
            env: { ...process.env, WDIO_UNIT_TESTS: '', WDIO_SKIP_DRIVER_SETUP: '' }
        })
        child.stdout!.on('data', data => { output += data })
        child.stderr!.on('data', data => { output += data })
        child.on('error', error => { spawnError = error })
        child.on('message', (message: Run & { type: string }) => {
            if (message.type === 'run:end') {
                runs.push(message)
            }
        })
        const exit = new Promise<{ code: number | null, signal: NodeJS.Signals | null }>(resolve => {
            child.once('close', (code, signal) => {
                closed = true
                resolve({ code, signal })
            })
        })
        const waitRuns = async (count: number) => {
            const deadline = performance.now() + 45_000
            while (true) {
                const counts = new Map<string, number>()
                for (const run of runs) {
                    const index = counts.get(run.cid) ?? 0
                    assert.equal(run.exitCode, [0, 1, 0, 0][index], `${run.cid} run ${index + 1}`)
                    counts.set(run.cid, index + 1)
                }
                if ([...counts.values()].filter(value => value >= count).length === workerCount) {
                    return
                }
                assert.ifError(spawnError)
                assert.ok(!closed, 'Watch exited before the run completed')
                assert.ok(performance.now() < deadline, `Timed out waiting for run ${count} of every worker`)
                await sleep(50)
            }
        }
        const readEvents = async () => (await fs.readFile(eventPath, 'utf8')).trim().split('\n')
            .filter(Boolean).map(line => JSON.parse(line) as SessionEvent | HookEvent)
        const stop = async () => {
            if (closed) {
                return exit
            }
            child.send('shutdown', () => {})
            let timer: ReturnType<typeof setTimeout> | undefined
            try {
                const result = await Promise.race([
                    exit,
                    new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), 15_000) })
                ])
                if (result) {
                    return result
                }
                if (process.platform === 'win32') {
                    await execFileAsync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
                } else {
                    process.kill(-child.pid!, 'SIGKILL')
                }
                await exit
                throw new Error('Watch required forced shutdown')
            } finally {
                clearTimeout(timer)
            }
        }
        let passed = false
        try {
            await waitRuns(1)
            const initialSessions = (await readEvents()).filter((event): event is SessionEvent => event.type === 'session')
                .flatMap(event => event.sessions)
            assert.equal(initialSessions.length, workerCount * (mode === 'single' ? 1 : 2))
            for (const session of initialSessions) {
                const response = await fetch(`http://localhost:${session.port}/session/${session.sessionId}/title`)
                assert.equal(response.status, 200, 'The local driver must survive the first worker exit')
                if (protocol === 'bidi') {
                    assert.equal(typeof session.capabilities.webSocketUrl, 'string')
                }
            }
            await fs.writeFile(specPath, spec(2, true))
            await waitRuns(2)
            await fs.writeFile(specPath, spec(3))
            await waitRuns(3)
            await fs.writeFile(watchedPath, 'changed')
            await waitRuns(4)
            assert.deepEqual(await stop(), { code: 0, signal: null })
            const events = await readEvents()
            const sessionEvents = events.filter((event): event is SessionEvent => event.type === 'session')
            assert.equal(sessionEvents.length, workerCount * 4)
            for (const cid of new Set(sessionEvents.map(event => event.cid))) {
                const workerSessions = sessionEvents.filter(event => event.cid === cid)
                const originalIds = workerSessions[0].sessions.map(session => session.sessionId)
                for (const event of workerSessions) {
                    assert.deepEqual(event.sessions.map(session => session.sessionId), originalIds)
                }
                const hooks = events.filter((event): event is HookEvent => event.type !== 'session' && event.cid === cid)
                assert.deepEqual(hooks.map(event => event.type).sort(), ['config', 'service'])
                hooks.forEach(hook => assert.deepEqual(hook.specs.map(spec => fileURLToPath(spec)), [specPath]))
            }
            for (const session of initialSessions) {
                const response = await fetch(`http://localhost:${session.port}/session/${session.sessionId}`)
                    .catch((error: Error & { cause?: { code?: string } }) => {
                        assert.equal(error.cause?.code, 'ECONNREFUSED')
                        return undefined
                    })
                if (response) {
                    assert.equal(response.status, 404, 'Shutdown must delete every retained session')
                }
            }
            passed = true
        } catch (error) {
            throw new Error(`Real watch test failed. Artifacts: ${directory}\n${output}`, { cause: error })
        } finally {
            await stop()
            // Detached Windows drivers need explicit cleanup if an assertion or startup failed.
            const sessions = (await readEvents()).filter((event): event is SessionEvent => event.type === 'session')
                .flatMap(event => event.sessions)
            for (const pid of new Set(sessions.map(session => session.capabilities['wdio:driverPID']))) {
                if (typeof pid === 'number') {
                    try {
                        process.kill(pid)
                    } catch (error) {
                        assert.equal((error as NodeJS.ErrnoException).code, 'ESRCH')
                    }
                }
            }
            if (passed) {
                assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
                assert.ok(path.basename(directory).startsWith(prefix))
                await fs.rm(directory, { recursive: true, force: true })
            }
        }
    }
)
