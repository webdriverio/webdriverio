import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startVitest } from 'vitest/node'

import { WdioBridgeReporter } from '../src/reporter.js'

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

const recorded: [string, Record<string, any>, string | undefined][] = []

class RecorderReporter {
    isSynchronised = true
    resolver?: () => string | undefined
    constructor(public options: Record<string, unknown>) {}
    setContextIdResolver(resolver: () => string | undefined) {
        this.resolver = resolver
    }
    emit(event: string, payload: Record<string, any>) {
        recorded.push([event, { ...payload }, this.resolver?.()])
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
        for (const [name, payload, contextId] of recorded) {
            if (name === 'runner:start' || name === 'runner:end') {
                expect(contextId).toBeUndefined()
            } else if (name === 'suite:start') {
                expect(contextId).toBeUndefined()
                expect(payload.parentUid).toBe(stack.at(-1) ?? null)
                expect(seenSuites.has(payload.uid)).toBe(false)
                seenSuites.add(payload.uid)
                stack.push(payload.uid)
            } else if (name === 'suite:end') {
                expect(contextId).toBeUndefined()
                expect(stack.pop()).toBe(payload.uid)
            } else if (name === 'test:start') {
                expect(contextId).toBe(payload.contextId)
                expect(seenTests.has(payload.uid)).toBe(false)
                seenTests.add(payload.uid)
                open.add(payload.uid)
            } else if (name === 'test:end') {
                expect(contextId).toBe(payload.contextId)
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
})
