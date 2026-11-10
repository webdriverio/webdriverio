import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, test, expect, vi } from 'vitest'
import Mocha from 'mocha'

import { MochaAdapter } from '../src/index.js'
import AllureReporter from '../../wdio-allure-reporter/src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const SPEC = '/project/after-each.spec.js'

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

/** a real Mocha run through the adapter, into the real Allure reporter (and the real base) */
async function run(mode: 'sequential' | 'parallel') {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-after-each-'))
    const allure = new AllureReporter({ outputDir, writeStream: { write: () => true } } as never)
    const bus = new EventEmitter()
    const emit = bus.emit.bind(bus)
    bus.emit = ((event: string, payload: unknown) => {
        allure.emit(event, payload)
        return emit(event, payload)
    }) as never
    const config = { framework: 'mocha', mochaOpts: { failHookAffectedTests: true, ...(mode === 'parallel' && { parallelMode: 'contexts' }) }, before: [], after: [], beforeSuite: [], afterSuite: [] }
    bus.emit('runner:start', { cid: '0-0', specs: [SPEC], capabilities: { browserName: 'chrome' }, config, sessionId: 's', isMultiRemote: false, instanceOptions: {}, retry: 0 })
    const mocha = new Mocha({ reporter: function () {} as never })
    const suite = Mocha.Suite.create(mocha.suite, 'Suite A')
    suite.afterEach('cleanup', () => { throw new Error('AFTER_EACH_BOOM') })
    suite.addTest(new Mocha.Test('t1', () => {}))
    suite.addTest(new Mocha.Test('t2', () => {}))
    const adapter = new MochaAdapter('0-0', config as never, [SPEC], {}, bus)
    adapter.setBrowser(mockBrowser())
    const failures = mode === 'parallel' ? await adapter['_runParallelMode'](mocha, 'contexts') : await adapter['_runSequential'](mocha)
    bus.emit('runner:end', { failures, cid: '0-0', retries: 0 })
    await vi.waitFor(() => expect(allure.isSynchronised).toBe(true))
    return fs.readdirSync(outputDir).filter((f) => f.endsWith('-result.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(outputDir, f), 'utf8')))
        .filter((r) => r.name.startsWith('"after each" hook'))
}

// the Allure result of a failed afterEach has the error of the hook
describe('Mocha: the Allure result of a failed afterEach', () => {
    test.each(['sequential', 'parallel'] as const)('has the message and the trace of the hook error (%s)', async (mode) => {
        const results = await run(mode)
        expect(results.length).toBeGreaterThan(0)
        for (const result of results) {
            expect([result.status, result.statusDetails.message, result.statusDetails.trace]).toEqual(['broken', expect.stringContaining('AFTER_EACH_BOOM'), expect.stringContaining('AFTER_EACH_BOOM')])
        }
    })
})
