import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import url from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import AiService from '../src/service.js'

describe('AiService', () => {
    it('adds act and extract to the browser, its elements and its browsing contexts, and starts capturing events', async () => {
        const browser = { addCommand: vi.fn() } as unknown as WebdriverIO.Browser
        const service = new AiService({ model: 'anthropic:claude-sonnet-5-5' })
        const agentFor = vi.spyOn(service.runtime, 'agentFor').mockResolvedValue({} as never)
        await service.before({}, [], browser)
        expect(agentFor).toHaveBeenCalledWith(browser)

        expect(browser.addCommand).toHaveBeenCalledTimes(6)
        expect(browser.addCommand).toHaveBeenNthCalledWith(1, 'act', expect.any(Function))
        expect(browser.addCommand).toHaveBeenNthCalledWith(2, 'act', expect.any(Function), { attachToElement: true })
        expect(browser.addCommand).toHaveBeenNthCalledWith(3, 'act', expect.any(Function), { attachToBrowsingContext: true })
        expect(browser.addCommand).toHaveBeenNthCalledWith(4, 'extract', expect.any(Function))
        expect(browser.addCommand).toHaveBeenNthCalledWith(5, 'extract', expect.any(Function), { attachToElement: true })
        expect(browser.addCommand).toHaveBeenNthCalledWith(6, 'extract', expect.any(Function), { attachToBrowsingContext: true })
    })

    it('runs the command on the scope it was called on', async () => {
        const commands: Function[] = []
        const browser = { addCommand: vi.fn((_name: string, fn: Function) => commands.push(fn)) } as unknown as WebdriverIO.Browser
        const service = new AiService()
        const act = vi.spyOn(service.runtime, 'act').mockResolvedValue({ source: 'model', steps: [] })
        vi.spyOn(service.runtime, 'agentFor').mockResolvedValue({} as never)
        await service.before({}, [], browser)

        const element = { elementId: 'el-1' }
        await commands[1].call(element, 'Open the menu', { timeout: 5000 })
        expect(act).toHaveBeenCalledWith(element, 'Open the menu', { timeout: 5000 })
    })
})

describe('AiService test tracking', () => {
    it('starts a test with its spec file and full title, and flushes the cache at the end', async () => {
        const service = new AiService({}, {}, { updateSnapshots: 'all', outputDir: '/logs' })
        const startTest = vi.spyOn(service.runtime, 'startTest')
        const endTest = vi.spyOn(service.runtime, 'endTest')
        const flush = vi.spyOn(service.runtime, 'flush').mockResolvedValue()
        expect(service.runtime.options).toMatchObject({ updateSnapshots: 'all', outputDir: '/logs' })

        vi.spyOn(service.runtime, 'agentFor').mockResolvedValue({} as never)
        const spec = path.resolve('/project/test/cart.e2e.ts')
        await service.before({}, [url.pathToFileURL(spec).href], { addCommand: vi.fn() } as unknown as WebdriverIO.Browser)
        service.beforeTest({ file: spec, fullTitle: 'cart adds a shirt' })
        expect(startTest).toHaveBeenLastCalledWith(spec, 'cart adds a shirt', undefined)
        await service.afterTest({ file: spec, fullTitle: 'cart adds a shirt' }, {}, { passed: false })
        expect(endTest).toHaveBeenCalledWith(false, spec, 'cart adds a shirt', undefined)

        service.beforeTest({ fullName: 'jasmine spec name' })
        expect(startTest).toHaveBeenLastCalledWith(spec, 'jasmine spec name', undefined)

        const feature = path.resolve('/project/features/cart.feature')
        service.beforeScenario({ pickle: { uri: url.pathToFileURL(feature).href, name: 'Add a shirt' } })
        expect(startTest).toHaveBeenLastCalledWith(feature, 'Add a shirt', undefined)
        await service.afterScenario({ pickle: { uri: url.pathToFileURL(feature).href, name: 'Add a shirt' } }, { passed: true })
        expect(endTest).toHaveBeenLastCalledWith(true, feature, 'Add a shirt', undefined)

        await service.after()
        expect(flush).toHaveBeenCalled()
    })

    /**
     * parallel mode runs the hooks of a test in the store of its browsing context
     */
    it('names the browsing context of a test and a scenario in parallel mode', async () => {
        const store = new AsyncLocalStorage<string>()
        const service = new AiService()
        const startTest = vi.spyOn(service.runtime, 'startTest')
        const endTest = vi.spyOn(service.runtime, 'endTest')
        vi.spyOn(service.runtime, 'agentFor').mockResolvedValue({} as never)
        const spec = path.resolve('/project/test/cart.e2e.ts')
        await service.before({}, [spec], { addCommand: vi.fn(), __parallelContextStore: store } as unknown as WebdriverIO.Browser)

        await store.run('ctx-1', async () => {
            service.beforeTest({ file: spec, title: 'pays' })
            await service.afterTest({ file: spec, title: 'pays' }, {}, { passed: true })
        })
        await store.run('ctx-2', async () => {
            service.beforeScenario({ pickle: { uri: spec, name: 'Pay' } })
            await service.afterScenario({ pickle: { uri: spec, name: 'Pay' } }, { passed: true })
        })

        expect(startTest.mock.calls).toEqual([[spec, 'pays', 'ctx-1'], [spec, 'Pay', 'ctx-2']])
        expect(endTest.mock.calls).toEqual([[true, spec, 'pays', 'ctx-1'], [true, spec, 'Pay', 'ctx-2']])
    })
})

describe('AiService multi-remote', () => {
    it('starts an agent session for every instance', async () => {
        const instanceA = { name: 'a' }
        const instanceB = { name: 'b' }
        const browser = {
            isMultiRemote: true,
            instances: ['a', 'b'],
            getInstance: (name: string) => name === 'a' ? instanceA : instanceB,
            addCommand: vi.fn()
        } as unknown as WebdriverIO.MultiRemoteBrowser
        const service = new AiService()
        const agentFor = vi.spyOn(service.runtime, 'agentFor').mockResolvedValue({} as never)
        await service.before({}, [], browser)
        expect(agentFor).toHaveBeenCalledWith(instanceA)
        expect(agentFor).toHaveBeenCalledWith(instanceB)
    })
})
