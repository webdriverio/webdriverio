import fs from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startVitest } from 'vitest/node'

import JsonReporter from '../../wdio-json-reporter/src/index.js'
import JunitReporter from '../../wdio-junit-reporter/src/index.js'
import { WdioBridgeReporter } from '../src/reporter.js'
import { ATTACHMENT_DIR_KEY } from '../src/types.js'

const SPEC = `
test('top level', () => {})
describe('block', () => {
    test('passes', () => {})
    test('fails', () => { throw new Error('boom') })
    test.skip('skipped', () => {})
    describe('nested', () => {
        test('deep', () => {})
    })
})
describe('parallel', () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    test.concurrent('slow', async () => { await sleep(60) })
    test.concurrent('fast', async () => { await sleep(10) })
})
`

const recorded: [string, Record<string, any>][] = []

class RecorderReporter {
    isSynchronised = true
    constructor(public options: Record<string, unknown>) {}
    emit(event: string, payload: Record<string, any>) {
        recorded.push([event, { ...payload }])
    }
}

describe('WdioBridgeReporter with a real Vitest run', () => {
    let dir: string

    beforeAll(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-bridge-'))
        await fs.writeFile(path.join(dir, 'a.spec.js'), SPEC)
    })

    afterAll(() => fs.rm(dir, { recursive: true, force: true }))

    it('streams a valid, fully settled event sequence', async () => {
        recorded.length = 0
        const events: any[] = []
        const errors: unknown[] = []
        const config = { reporters: [[RecorderReporter, {}]] } as unknown as WebdriverIO.Config
        const bridge = new WdioBridgeReporter(config, (event) => events.push(event), (err) => errors.push(err))

        const vitest = await startVitest([], { run: true, watch: false, config: false }, {
            root: dir,
            test: {
                include: ['a.spec.js'],
                reporters: [bridge],
                pool: 'forks',
                globals: true,
                provide: { wdioCapabilities: { browserName: 'chrome' } }
            }
        } as never)
        try {
            // nothing may still be in flight once Vitest resolved
            const countAtResolve = recorded.length
            expect(events.some(({ type }) => type === 'job:end')).toBe(true)
            await new Promise((resolve) => setTimeout(resolve, 50))
            expect(recorded).toHaveLength(countAtResolve)
        } finally {
            await vitest.close()
        }

        expect(errors).toEqual([])
        expect(events.filter(({ type }) => type === 'job:start')).toHaveLength(1)
        expect(events.at(-1)).toMatchObject({ type: 'job:end', passed: false })

        const stack: string[] = []
        const open = new Set<string>()
        const seenSuites = new Set<string>()
        const seenTests = new Set<string>()
        const ended: string[] = []
        for (const [name, payload] of recorded) {
            if (name === 'suite:start') {
                expect(payload.parentUid).toBe(stack.at(-1) ?? null)
                expect(seenSuites.has(payload.uid)).toBe(false)
                seenSuites.add(payload.uid)
                stack.push(payload.uid)
            } else if (name === 'suite:end') {
                expect(stack.pop()).toBe(payload.uid)
            } else if (name === 'test:start') {
                expect(seenTests.has(payload.uid)).toBe(false)
                seenTests.add(payload.uid)
                open.add(payload.uid)
            } else if (name === 'test:end') {
                expect(open.delete(payload.uid)).toBe(true)
                ended.push(payload.fullTitle)
            }
        }
        expect(stack).toEqual([])
        expect(open.size).toBe(0)
        expect(recorded[0][0]).toBe('runner:start')
        expect(recorded.at(-1)![0]).toBe('runner:end')
        expect(recorded.at(-1)![1]).toMatchObject({ failures: 1 })
        expect(recorded.filter(([name]) => name === 'test:fail').map(([, payload]) => payload.fullTitle)).toEqual(['block fails'])
        expect(recorded.filter(([name]) => name === 'test:pending').map(([, payload]) => payload.fullTitle)).toEqual(['block skipped'])
        expect(ended.toSorted()).toEqual([
            'a.spec.js top level', 'block fails', 'block nested deep', 'block passes', 'block skipped', 'parallel fast', 'parallel slow'
        ])
    })

    it('reports a failing beforeAll and afterAll as failed hooks of their suite, and nothing for passing hooks', async () => {
        recorded.length = 0
        const hookDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-hooks-'))
        await fs.writeFile(path.join(hookDir, 'h.spec.js'), `
describe('after', () => { afterAll(() => { throw new Error('after boom') }); test('t1', () => {}) })
describe('before', () => { beforeAll(() => { throw new Error('before boom') }); test('t2', () => {}) })
describe('fine', () => { beforeAll(() => {}); afterAll(() => {}); test('t3', () => {}) })
`)
        const config = { reporters: [[RecorderReporter, {}]] } as unknown as WebdriverIO.Config
        const bridge = new WdioBridgeReporter(config, () => {})
        const vitest = await startVitest([], { run: true, watch: false, config: false }, {
            root: hookDir,
            test: { include: ['h.spec.js'], reporters: [bridge], pool: 'forks', globals: true, provide: { wdioCapabilities: { browserName: 'chrome' } } }
        } as never)
        await vitest.close()
        await fs.rm(hookDir, { recursive: true, force: true })

        const hookEnds = recorded.filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
        expect(hookEnds.map(({ title, state, parent, error }) => ({ title, state, parent, message: error.message }))).toEqual([
            { title: '"after all" hook in "after"', state: 'fail', parent: 'after', message: 'after boom' },
            { title: '"before all" hook in "before"', state: 'fail', parent: 'before', message: 'before boom' }
        ])
        expect(recorded.filter(([name]) => name === 'hook:start').map(([, payload]) => payload.uid)).toEqual(hookEnds.map(({ uid }) => uid))
    })

    const runHookSpec = async (spec: string, setup?: string) => {
        recorded.length = 0
        const hookDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-hooks2-'))
        await fs.writeFile(path.join(hookDir, 'h.spec.js'), spec)
        if (setup) {
            await fs.writeFile(path.join(hookDir, 'setup.js'), setup)
        }
        const config = { reporters: [[RecorderReporter, {}]] } as unknown as WebdriverIO.Config
        const bridge = new WdioBridgeReporter(config, () => {})
        const vitest = await startVitest([], { run: true, watch: false, config: false }, {
            root: hookDir,
            test: { include: ['h.spec.js'], setupFiles: setup ? ['setup.js'] : [], reporters: [bridge], pool: 'forks', globals: true, provide: { wdioCapabilities: { browserName: 'chrome' } } }
        } as never)
        await vitest.close()
        await fs.rm(hookDir, { recursive: true, force: true })
        const hookEnds = recorded.filter(([name]) => name === 'hook:end').map(([, payload]) => payload)
        expect(new Set(hookEnds.map(({ uid }) => uid)).size).toBe(hookEnds.length)
        return hookEnds.map(({ title, error }) => [title, error.message])
    }

    it('keeps a failed beforeAll next to a passing or failing afterAll of the same suite', async () => {
        expect(await runHookSpec(`
describe('passing after', () => { beforeAll(() => { throw new Error('b1') }); afterAll(() => {}); test('t1', () => {}) })
describe('failing both', () => { beforeAll(() => { throw new Error('b2') }); afterAll(() => { throw new Error('a2') }); test('t2', () => {}) })
`)).toEqual([
            ['"before all" hook in "passing after"', 'b1'],
            ['"before all" hook in "failing both"', 'b2'],
            ['"after all" hook in "failing both"', 'a2']
        ])
    })

    it('keeps a failed session style beforeAll next to the module level afterAll of a setup file', async () => {
        expect(await runHookSpec('test(\'t1\', () => {})', `
import { afterAll, beforeAll } from 'vitest'
beforeAll(() => { throw new Error('session boom') })
afterAll(() => {})
`)).toEqual([['"before all" hook in "{root}"', 'session boom']])
    })

    it('reports test.fails outcomes accurately across afterTest, JUnit, and JSON reporters with real Vitest flip timing', async () => {
        const server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (req.method === 'POST' && req.url === '/session') {
                res.end(JSON.stringify({ value: { sessionId: 'sess-fails', capabilities: { browserName: 'chrome' } } }))
                return
            }
            if (req.method === 'DELETE' && req.url === '/session/sess-fails') {
                res.end(JSON.stringify({ value: null }))
                return
            }
            res.statusCode = 404
            res.end(JSON.stringify({ value: null }))
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const { port } = server.address() as { port: number }
        const runDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-vitest-fails-'))
        const outDir = path.join(runDir, 'reports')
        await fs.mkdir(outDir, { recursive: true })
        const logPath = path.join(runDir, 'after-test.jsonl')
        const confPath = path.join(runDir, 'wdio.conf.mjs')
        const setupPath = path.resolve(import.meta.dirname, '../src/setup.ts')

        await fs.writeFile(confPath, `
import fs from 'node:fs/promises'
export const config = {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: ${port},
    path: '/',
    logLevel: 'silent',
    connectionRetryCount: 0,
    capabilities: [{ browserName: 'chrome' }],
    async afterTest(test, _context, result) {
        await fs.appendFile(${JSON.stringify(logPath)}, JSON.stringify({
            title: test.title,
            passed: result.passed,
            status: result.status,
            error: result.error?.message ?? null,
            attempts: result.retries.attempts
        }) + '\\n')
    }
}
`)
        await fs.writeFile(path.join(runDir, 'fails.spec.mjs'), `
let attempt = 0
describe('test.fails', () => {
    test.fails('expected failure', () => { throw new Error('expected boom') })
    test.fails('unexpected pass', () => {})
    test.fails('soft assertion failure', async () => { await expect.soft(1).toBe(2) })
    test.fails('retry pass then fail', { retry: 1 }, () => {
        if (attempt++ === 0) { return }
        throw new Error('fail on retry')
    })
})
`)

        try {
            const errors: unknown[] = []
            const bridge = new WdioBridgeReporter({
                outputDir: outDir,
                reporters: [
                    [JunitReporter, { outputDir: outDir }],
                    [JsonReporter, { outputDir: outDir }]
                ]
            } as unknown as WebdriverIO.Config, () => {}, (err) => errors.push(err))

            const vitest = await startVitest([], { run: true, watch: false, config: false }, {
                root: runDir,
                test: {
                    include: ['fails.spec.mjs'],
                    setupFiles: [setupPath],
                    reporters: [bridge],
                    pool: 'forks',
                    globals: true,
                    provide: {
                        wdioConfigFile: confPath,
                        wdioArgs: {},
                        wdioCapabilities: { browserName: 'chrome' },
                        wdioProjectIndex: 0,
                        [ATTACHMENT_DIR_KEY]: null
                    }
                }
            } as never)
            const unhandled = vitest.state.getUnhandledErrors()
            const modErrors = vitest.state.getTestModules().flatMap((m) => m.errors())
            await vitest.close()

            expect(unhandled).toEqual([])
            expect(modErrors).toEqual([])
            expect(errors).toEqual([])
            const afterTests = (await fs.readFile(logPath, 'utf8'))
                .trim()
                .split('\n')
                .map((line) => JSON.parse(line))
            expect(afterTests).toEqual([
                { title: 'expected failure', passed: true, status: 'passed', error: null, attempts: 0 },
                { title: 'unexpected pass', passed: false, status: 'failed', error: 'Expect test to fail', attempts: 0 },
                { title: 'soft assertion failure', passed: true, status: 'passed', error: null, attempts: 0 },
                { title: 'retry pass then fail', passed: false, status: 'failed', error: 'Expect test to fail', attempts: 0 },
                { title: 'retry pass then fail', passed: true, status: 'passed', error: null, attempts: 1 }
            ])

            const reportFiles = await fs.readdir(outDir)
            const junitFile = reportFiles.find((file) => file.toLowerCase().includes('junit'))!
            const jsonFile = reportFiles.find((file) => file.endsWith('.json'))!
            expect(junitFile).toBeTruthy()
            expect(jsonFile).toBeTruthy()

            const xml = await fs.readFile(path.join(outDir, junitFile), 'utf8')
            expect(xml).toContain('name="expected failure"')
            expect(xml).toContain('name="soft assertion failure"')
            expect(xml).toContain('name="retry pass then fail"')
            expect(xml).toContain('Expect test to fail')
            expect(xml.match(/<failure/g)).toHaveLength(1)

            const jsonReport = JSON.parse(await fs.readFile(path.join(outDir, jsonFile), 'utf8'))
            expect(jsonReport.state).toEqual({ passed: 3, failed: 1, skipped: 0 })
            const jsonTests = jsonReport.suites.flatMap((suite: { tests: { name: string, state: string }[] }) => suite.tests)
            expect(jsonTests.find((t: { name: string }) => t.name === 'expected failure')?.state).toBe('passed')
            expect(jsonTests.find((t: { name: string }) => t.name === 'soft assertion failure')?.state).toBe('passed')
            expect(jsonTests.find((t: { name: string }) => t.name === 'unexpected pass')?.state).toBe('failed')
            expect(jsonTests.filter((t: { name: string, state: string }) => t.name === 'retry pass then fail').map((t: { state: string }) => t.state)).toContain('passed')
        } finally {
            server.close()
            await fs.rm(runDir, { recursive: true, force: true })
        }
    }, 30_000)
})
