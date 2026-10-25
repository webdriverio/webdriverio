import path from 'node:path'
import { EventEmitter } from 'node:events'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, test, expect, vi } from 'vitest'
import Mocha from 'mocha'

import { MochaAdapter } from '../src/index.js'
import JunitReporter from '../../wdio-junit-reporter/src/index.js'
import JsonReporter from '../../wdio-json-reporter/src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const SPEC = '/project/root-hooks.spec.js'

function mockBrowser() {
    let idx = 0
    return {
        isBidi: true,
        __parallelContextStore: new AsyncLocalStorage<string>(),
        __parallelContexts: new Set<string>(),
        __bidiCommandsEnabled: true,
        browsingContextCreate: vi.fn().mockImplementation(async () => ({ context: `ctx-${idx++}` })),
        browsingContextClose: vi.fn().mockResolvedValue(undefined)
    } as never
}

/** a real parallel Mocha run through the adapter, into the real JUnit and JSON reporters (and the real base) */
async function run(build: (root: Mocha.Suite) => void, failHookAffectedTests: boolean) {
    const out = { junit: '', json: '' }
    const junit = new JunitReporter({ writeStream: { write: (s: string) => { out.junit += s; return true } } } as never)
    const json = new JsonReporter({ writeStream: { write: (s: string) => { out.json += s; return true } } } as never)
    const bus = new EventEmitter()
    const emit = bus.emit.bind(bus)
    bus.emit = ((event: string, payload: unknown) => {
        junit.emit(event, payload)
        json.emit(event, payload)
        return emit(event, payload)
    }) as never
    const config = { framework: 'mocha', mochaOpts: { failHookAffectedTests, parallelMode: 'contexts' }, before: [], after: [], beforeSuite: [], afterSuite: [] }
    bus.emit('runner:start', { cid: '0-0', specs: [SPEC], capabilities: { browserName: 'chrome' }, config, sessionId: 's', isMultiRemote: false, instanceOptions: {}, retry: 0 })
    const mocha = new Mocha({ reporter: function () {} as never })
    build(mocha.suite)
    const adapter = new MochaAdapter('0-0', config as never, [SPEC], {}, bus)
    adapter.setBrowser(mockBrowser())
    const failures = await adapter['_runParallelMode'](mocha, 'contexts')
    bus.emit('runner:end', { failures, cid: '0-0', retries: 0 })
    return { failures, junit: out.junit, json: JSON.parse(out.json) }
}

const failedTestCases = (xml: string) => [...xml.matchAll(/<testcase [^>]*name="([^"]*)"[^>]*>\s*<failure message="([^"]*)"/g)].map(([, name, message]) => `${name}: ${message}`)

// G1: a failed root hook of a parallel Mocha run is in the JUnit report and in the JSON count, as on main
describe('Mocha parallelMode: a failed root before / after all in the reports', () => {
    test('a failed root after(): one failed hook testcase, counted in the JSON report', async () => {
        const r = await run((root) => {
            root.afterAll('root teardown', () => { throw new Error('ROOT_AFTER_BOOM') })
            Mocha.Suite.create(root, 'Suite S').addTest(new Mocha.Test('t1', () => {}))
        }, true)
        expect(r.failures).toBe(1)
        expect(failedTestCases(r.junit)).toEqual([expect.stringMatching(/^after all hook root teardown.*: .*ROOT_AFTER_BOOM/)])
        expect(r.json.state.failed).toBe(1)
    })

    test('a failed root before() with failHookAffectedTests: false: one failed hook testcase, counted in the JSON report', async () => {
        const r = await run((root) => {
            root.beforeAll('root setup', () => { throw new Error('ROOT_BEFORE_BOOM') })
            Mocha.Suite.create(root, 'Suite S').addTest(new Mocha.Test('t1', () => {}))
        }, false)
        expect(r.failures).toBe(1)
        expect(failedTestCases(r.junit)).toEqual([expect.stringMatching(/^before all hook root setup.*: .*ROOT_BEFORE_BOOM/)])
        expect(r.json.state.failed).toBe(1)
    })
})
