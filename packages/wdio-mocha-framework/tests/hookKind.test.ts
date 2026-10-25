import path from 'node:path'
import { EventEmitter } from 'node:events'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import Mocha from 'mocha'
import { logMock } from '../../../__mocks__/@wdio/logger.js'

import { MochaAdapter } from '../src/index.js'
import { formatMessage } from '../src/common.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type Event = { event: string, payload: Record<string, any> }

/** a real sequential Mocha run through the adapter, with the WDIO beforeSuite / afterSuite root hooks */
async function run(build: (root: Mocha.Suite) => void, mochaOpts: Record<string, unknown> = {}) {
    const mocha = new Mocha({ reporter: function () {} as never, ...mochaOpts })
    build(mocha.suite)
    const reporter = new EventEmitter()
    const events: Event[] = []
    for (const event of ['suite:start', 'suite:end', 'test:start', 'test:end', 'hook:start', 'hook:end']) {
        reporter.on(event, (payload) => events.push({ event, payload }))
    }
    const adapter = new MochaAdapter(
        '0-0',
        { mochaOpts: { failHookAffectedTests: true, ...mochaOpts }, after: [], beforeSuite: [], afterSuite: [] } as never,
        ['/spec.js'],
        {},
        reporter
    )
    await adapter['_runSequential'](mocha)
    return events
}

const suite = (parent: Mocha.Suite, title: string) => Mocha.Suite.create(parent, title)
const addTest = (parent: Mocha.Suite, title: string, fn: () => void = () => {}) => parent.addTest(new Mocha.Test(title, fn))
const hooksOf = (events: Event[], event: 'hook:start' | 'hook:end') => events.filter((e) => e.event === event).map((e) => e.payload)
const suiteUid = (events: Event[], title: string) => events.find((e) => e.event === 'suite:start' && e.payload.title === title)!.payload.uid

describe('Mocha sequential hook events: hookKind and hookSuiteUid', () => {
    beforeEach(() => {
        logMock.debug.mockClear()
    })

    test('every hook type has its kind, and all-hooks have the uid of their declaring suite', async () => {
        const events = await run((root) => {
            root.beforeAll('root setup', () => {})
            const outer = suite(root, 'outer')
            outer.beforeAll(() => {})
            outer.beforeEach(() => {})
            outer.afterEach(() => {})
            outer.afterAll(() => {})
            const inner = suite(outer, 'inner')
            inner.beforeAll(() => {})
            inner.afterAll(() => {})
            addTest(inner, 't1')
        })

        const starts = hooksOf(events, 'hook:start').map((h) => [h.title, h.hookKind, h.hookSuiteUid])
        expect(starts).toEqual([
            // the root `before` and WDIO beforeSuite: the root suite has no suite event, so no hookSuiteUid
            ['"before all" hook: root setup in "{root}"', 'beforeAll', undefined],
            ['"before all" hook in "{root}"', 'beforeAll', undefined],
            ['"before all" hook for outer', 'beforeAll', suiteUid(events, 'outer')],
            ['"before all" hook for inner', 'beforeAll', suiteUid(events, 'inner')],
            ['"before each" hook for outer', 'beforeEach', undefined],
            ['"after each" hook for outer', 'afterEach', undefined],
            ['"after all" hook for inner', 'afterAll', suiteUid(events, 'inner')],
            ['"after all" hook for outer', 'afterAll', suiteUid(events, 'outer')],
            ['"after all" hook in "{root}"', 'afterAll', undefined]
        ])
        expect(logMock.debug).not.toHaveBeenCalled()
    })

    test('hook:start and hook:end of each hook run have the same uid, kind and suite', async () => {
        const events = await run((root) => {
            const outer = suite(root, 'outer')
            outer.beforeAll(() => {})
            outer.beforeEach(() => {})
            outer.afterEach(() => {})
            outer.afterAll(() => {})
            addTest(outer, 'a')
            const inner = suite(outer, 'inner')
            inner.beforeAll(() => {})
            addTest(inner, 'b')
            addTest(inner, 'c')
        })

        const hookEvents = events.filter((e) => e.event.startsWith('hook:'))
        expect(hookEvents.length).toBe(2 * hooksOf(events, 'hook:start').length)
        for (let i = 0; i < hookEvents.length; i += 2) {
            const [start, end] = [hookEvents[i], hookEvents[i + 1]]
            expect([start.event, end.event]).toEqual(['hook:start', 'hook:end'])
            expect(end.payload.uid).toBe(start.payload.uid)
            expect(end.payload.hookKind).toBe(start.payload.hookKind)
            expect(end.payload.hookSuiteUid).toBe(start.payload.hookSuiteUid)
        }
    })

    test.each([
        ['beforeAll', 'before all'],
        ['beforeEach', 'before each'],
        ['afterEach', 'after each'],
        ['afterAll', 'after all']
    ] as const)('a failing %s ends with the uid and the kind of its hook:start', async (kind, title) => {
        const events = await run((root) => {
            const outer = suite(root, 'outer')
            outer[kind](() => { throw new Error('boom') })
            addTest(outer, 'a')
        })

        const start = hooksOf(events, 'hook:start').find((h) => h.title === `"${title}" hook for outer`)!
        const end = hooksOf(events, 'hook:end').find((h) => h.uid === start.uid)!
        expect(end).toMatchObject({ hookKind: kind, error: { message: 'boom' } })
        expect(start.hookKind).toBe(kind)
        const allHook = kind === 'beforeAll' || kind === 'afterAll'
        expect(end.hookSuiteUid).toBe(allHook ? suiteUid(events, 'outer') : undefined)
    })

    test('this.skip() in a before all hook ends it with its uid and kind', async () => {
        const events = await run((root) => {
            const outer = suite(root, 'outer')
            outer.beforeAll(function (this: Mocha.Context) { this.skip() })
            addTest(outer, 'a')
        })

        const start = hooksOf(events, 'hook:start').find((h) => h.title === '"before all" hook for outer')!
        const end = hooksOf(events, 'hook:end').find((h) => h.uid === start.uid)!
        expect(end).toMatchObject({ hookKind: 'beforeAll', hookSuiteUid: suiteUid(events, 'outer') })
    })
})

describe('formatMessage hookKind', () => {
    const hookIn = (list: '_beforeAll' | '_beforeEach' | '_afterEach' | '_afterAll', title: string) => {
        const hook: Record<string, unknown> = { title, type: 'hook' }
        hook.parent = { title: 'S', _beforeAll: [], _beforeEach: [], _afterEach: [], _afterAll: [], [list]: [hook] }
        return hook
    }

    beforeEach(() => {
        logMock.debug.mockClear()
    })

    test('the hook list of the suite gives the kind, and a title that disagrees is logged', () => {
        const message = formatMessage({ type: 'hook:start', payload: hookIn('_beforeAll', '"before each" hook') })
        expect(message.hookKind).toBe('beforeAll')
        expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('"before each" hook'))
    })

    test('no hookKind for a hook that is in no hook list of its suite (custom interfaces)', () => {
        const message = formatMessage({ type: 'hook:start', payload: { title: '"before all" hook', parent: { title: 'S' } } })
        expect(message).not.toHaveProperty('hookKind')
    })

    test('no hookKind on test and suite events', () => {
        const hook = hookIn('_beforeAll', '"before all" hook')
        expect(formatMessage({ type: 'test:start', payload: hook })).not.toHaveProperty('hookKind')
        expect(formatMessage({ type: 'suite:start', payload: hook })).not.toHaveProperty('hookKind')
    })
})
