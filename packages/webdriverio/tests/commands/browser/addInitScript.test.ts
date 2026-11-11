import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, it, vi, beforeAll, afterAll } from 'vitest'

import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('addInitScript', () => {
    const noopParallelContextStore = getParallelContextStore()
    const store = new AsyncLocalStorage<string>()
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        setParallelContextStore(store)
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'bidi' }
        })
        vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue({ subscription: 's' })
        vi.spyOn(browser, 'getWindowHandle').mockResolvedValue('main-window')
    })

    afterAll(() => {
        setParallelContextStore(noopParallelContextStore)
    })

    it('registers the preload script on the store context in a parallel test', async () => {
        const add = vi.spyOn(browser, 'scriptAddPreloadScript').mockResolvedValue({ script: 'p1' })

        await store.run('ctx-1', () => browser.addInitScript(() => 1))

        expect(add).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['ctx-1'] }))
        expect(browser.getWindowHandle).not.toHaveBeenCalled()
    })

    it('uses the session window handle outside the scope', async () => {
        const add = vi.spyOn(browser, 'scriptAddPreloadScript').mockResolvedValue({ script: 'p2' })

        await browser.addInitScript(() => 1)

        expect(add).toHaveBeenLastCalledWith(expect.objectContaining({ contexts: ['main-window'] }))
    })
})
