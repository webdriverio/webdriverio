import path from 'node:path'
import { EventEmitter } from 'node:events'
import { test, expect, vi } from 'vitest'
import Mocha from 'mocha'

import { MochaAdapter } from '../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const SPEC = '/project/late-error.spec.js'

type MochaRunner = Mocha.Runner & { uncaught: () => void, unhandled: () => void }

// after the run, Mocha keeps listeners that swallow a late rejection and throw a late error again;
// without them the runner shows a late error, fails the run and keeps the reports
test('removes the process listeners of Mocha after the run, before the after hook', async () => {
    let afterHookListeners: Function[] = []
    const config = {
        framework: 'mocha', mochaOpts: {}, before: [], beforeSuite: [], afterSuite: [],
        after: [() => { afterHookListeners = [...process.listeners('uncaughtException'), ...process.listeners('unhandledRejection')] }]
    }
    const mocha = new Mocha({ reporter: function () {} as never })
    mocha.suite.addTest(new Mocha.Test('passes', () => {}))
    const adapter = new MochaAdapter('0-0', config as never, [SPEC], {}, new EventEmitter() as never)

    expect(await adapter['_runSequential'](mocha)).toBe(0)
    const runner = adapter['_runner'] as MochaRunner
    try {
        expect(process.listeners('uncaughtException')).not.toContain(runner.uncaught)
        expect(process.listeners('unhandledRejection')).not.toContain(runner.unhandled)
        expect(afterHookListeners).not.toContain(runner.uncaught)
        expect(afterHookListeners).not.toContain(runner.unhandled)
    } finally {
        // without the fix, the listeners of the stopped runner would stay on the test worker
        runner.dispose()
    }
})
