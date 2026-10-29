import path from 'node:path'
import { EventEmitter } from 'node:events'
import { expect, test, vi } from 'vitest'

import { JasmineAdapter } from '../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

test('a real Jasmine run sends hookKind on every hook event, and the uid of the declaring suite on its all-hooks', async () => {
    const reporter = new EventEmitter()
    const events: { event: string, payload: Record<string, any> }[] = []
    for (const event of ['suite:start', 'hook:start', 'hook:end']) {
        reporter.on(event, (payload) => events.push({ event, payload }))
    }
    const adapter = new JasmineAdapter(
        '0-0',
        { beforeHook: [], afterHook: [], beforeTest: [], afterTest: [] } as any,
        [path.join(__dirname, '__fixtures__', 'hookKinds.js')],
        { browserName: 'chrome' } as any,
        reporter as any
    )

    await adapter.init()
    expect(await adapter.run()).toBe(1)

    const uidOf = (title: string) => events.find((e) => e.event === 'suite:start' && e.payload.title === title)!.payload.uid
    const hooks = events.filter((e) => e.event !== 'suite:start').map(({ event, payload: p }) => [event, p.uid, p.hookKind, p.hookSuiteUid])
    const pair = (title: string, kind: string, suiteUid?: string) => [
        ['hook:start', `"${title}" hook`, kind, suiteUid],
        ['hook:end', `"${title}" hook`, kind, suiteUid]
    ]
    expect(hooks).toEqual([
        // the top-level all-hooks have no suite event above them
        ...pair('before all', 'beforeAll'),
        ...pair('before all', 'beforeAll', uidOf('outer suite')),
        ...pair('before all', 'beforeAll', uidOf('inner suite')),
        ...pair('after all', 'afterAll', uidOf('inner suite')),
        ...pair('after all', 'afterAll', uidOf('outer suite')),
        ...pair('after all', 'afterAll')
    ])
})
