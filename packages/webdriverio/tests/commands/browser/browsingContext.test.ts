import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

import { BIDI_MASK, ELEMENT_KEY } from 'webdriver'

import { remote } from '../../../src/index.js'
import { getBrowsingContext } from '../../../src/browsingContext.js'
import { getContextManager } from '../../../src/session/context.js'
import { getElement } from '../../../src/utils/getElementObject.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        getCurrentContext: vi.fn().mockResolvedValue('top-context'),
        setCurrentContext: vi.fn(),
        findParentContext: vi.fn().mockReturnValue(undefined),
        findContext: vi.fn()
    }))
}))

vi.mock('../../../src/session/networkManager.js', () => ({
    getNetworkManager: vi.fn().mockReturnValue({
        initialize: vi.fn(),
        getPendingRequests: vi.fn().mockReturnValue([]),
        getRequestResponseData: vi.fn().mockResolvedValue({ url: 'https://example.com' })
    })
}))

describe('browsing context', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })
    })

    it('returns the initial context from url() and navigates that same context again', async () => {
        vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: 'nav-1', url: 'https://example.com/' })
        const first = await browser.url('https://example.com')
        const second = await browser.url('https://example.com/next')
        expect(first?.contextId).toBe('top-context')
        expect(second?.contextId).toBe('top-context')
        expect(first?.request).toEqual({ url: 'https://example.com' })
        expect(browser.browsingContextNavigate).toHaveBeenCalledWith(expect.objectContaining({
            context: 'top-context'
        }))
        expect(getContextManager(browser).setCurrentContext).not.toHaveBeenCalled()
    })

    it('opens a window without switching to it', async () => {
        vi.spyOn(browser, 'browsingContextCreate').mockResolvedValue({ context: 'new-tab', type: 'tab' } as never)
        vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: null, url: 'https://webdriver.io/' })
        const switchToWindow = vi.spyOn(browser, 'switchToWindow')
        const created = await browser.newWindow('https://webdriver.io', {
            type: 'tab',
            referenceContext: 'top-context'
        })
        expect(created).toMatchObject({ contextId: 'new-tab', isFrame: false, url: 'https://webdriver.io' })
        expect(switchToWindow).not.toHaveBeenCalled()
        expect(getContextManager(browser).setCurrentContext).not.toHaveBeenCalled()
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({
            type: 'tab',
            referenceContext: 'top-context'
        })
    })

    it('rejects a frame as referenceContext', async () => {
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
        await expect(browser.newWindow('https://webdriver.io', { referenceContext: frame }))
            .rejects.toThrow('top-level browsing context')
    })

    it('lists top-level contexts and finds a nested frame with its parent', async () => {
        vi.spyOn(browser, 'browsingContextGetTree').mockImplementation(async (params) => {
            if (params && 'root' in params && params.root === 'child') {
                return {
                    contexts: [{
                        context: 'child',
                        url: 'https://child.example',
                        children: [{ context: 'nested', url: 'https://nested.example', children: [] }]
                    }]
                } as never
            }
            return {
                contexts: [{
                    context: 'top-context',
                    url: 'https://example.com',
                    children: [{
                        context: 'child',
                        url: 'https://child.example',
                        children: [{ context: 'nested', url: 'https://nested.example', children: [] }]
                    }]
                }]
            } as never
        })
        const pages = await browser.browsingContexts()
        expect(pages.map((page) => page.contextId)).toEqual(['top-context'])
        expect(pages[0]?.parent).toBeUndefined()

        const child = await pages[0]!.frame('https://child.example')
        expect(child.contextId).toBe('child')
        expect(child.isFrame).toBe(true)
        expect(child.parent?.contextId).toBe('top-context')

        const nested = await child.frame('https://nested.example')
        expect(nested.contextId).toBe('nested')
        expect(nested.parent?.contextId).toBe('child')
    })

    it('runs execute and a frame query in the held context', async () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        const scriptCallFunction = vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({
            type: 'success',
            result: { type: 'string', value: 'Example' }
        } as never)
        await expect(page.getTitle()).resolves.toBe('Example')
        expect(scriptCallFunction).toHaveBeenCalledWith(expect.objectContaining({
            target: { context: 'top-context' }
        }))
    })

    it('rejects top-level commands on a frame and custom commands on any context', async () => {
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        await expect(frame.setViewport({ width: 100, height: 100 })).rejects.toThrow('top-level')
        await expect(frame.closeWindow()).rejects.toThrow('top-level')
        await expect(frame.back()).rejects.toThrow('top-level')
        await expect(page.addCommand('nope', () => {})).rejects.toThrow('only available on the browser')
        await expect(browser.switchWindow('https://example.com')).rejects.toThrow('switchWindow')
        await expect(browser.switchFrame(null)).rejects.toThrow('switchFrame')
    })

    it('scopes navigation, cookies, history, and prompts to the held context', async () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com/' })
        vi.spyOn(browser, 'storageGetCookies').mockResolvedValue({
            cookies: [{
                name: 'a',
                value: { type: 'string', value: '1' },
                domain: 'example.com',
                path: '/',
                secure: false,
                httpOnly: false,
                sameSite: 'none',
                size: 1
            }]
        } as never)
        vi.spyOn(browser, 'storageSetCookie').mockResolvedValue({} as never)
        vi.spyOn(browser, 'storageDeleteCookies').mockResolvedValue({} as never)
        await expect(page.getCookies()).resolves.toMatchObject([{ name: 'a', value: '1' }])
        expect(browser.storageGetCookies).toHaveBeenCalledWith({
            partition: { type: 'context', context: 'top-context' }
        })
        await page.setCookies([{ name: 'b', value: '2' }])
        expect(browser.storageSetCookie).toHaveBeenCalledWith(expect.objectContaining({
            partition: { type: 'context', context: 'top-context' }
        }))
        await page.deleteCookies('b')
        expect(browser.storageDeleteCookies).toHaveBeenCalledWith(expect.objectContaining({
            partition: { type: 'context', context: 'top-context' }
        }))

        vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: 'nav-2', url: 'https://example.com/next' })
        const navigated = await page.navigate('/next')
        expect(navigated.contextId).toBe('top-context')
        expect(page.url).toBe('http://foobar.com/next')
        expect(browser.browsingContextNavigate).toHaveBeenCalledWith(expect.objectContaining({
            context: 'top-context',
            url: 'http://foobar.com/next'
        }))

        vi.spyOn(browser, 'browsingContextActivate').mockResolvedValue({} as never)
        vi.spyOn(browser, 'browsingContextTraverseHistory').mockResolvedValue({} as never)
        vi.spyOn(browser, 'browsingContextReload').mockResolvedValue({} as never)
        await page.activate()
        await page.forward()
        await page.refresh()
        expect(browser.browsingContextActivate).toHaveBeenCalledWith({ context: 'top-context' })
        expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({ context: 'top-context', delta: 1 })
        expect(browser.browsingContextReload).toHaveBeenCalledWith({ context: 'top-context', wait: 'complete' })

        vi.spyOn(browser, 'browsingContextHandleUserPrompt').mockResolvedValue({} as never)
        await page.acceptAlert('ok')
        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            context: 'top-context',
            accept: true,
            userText: 'ok'
        })
    })

    it('registers onBeforeLoad in a held tab that is not the focused window', async () => {
        const tab = getBrowsingContext(browser, 'new-tab', { isFrame: false, url: 'https://example.com' })
        vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: null, url: 'https://example.com/next' })
        vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue(undefined as never)
        vi.spyOn(browser, 'scriptRemovePreloadScript').mockResolvedValue({} as never)
        const preload = vi.spyOn(browser, 'scriptAddPreloadScript').mockResolvedValue({ script: 'preload-1' } as never)

        await tab.navigate('https://example.com/next', { onBeforeLoad: () => {} })

        expect(preload).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['new-tab'] }))
    })

    it('sends input actions to the held context', async () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})
        await page.keys('a')
        expect(perform).toHaveBeenCalledWith(expect.objectContaining({ context: 'top-context' }))
        expect(release).not.toHaveBeenCalled()
    })

    it('resolves an XPath frame selector without waiting for the frame tree', async () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        page.options.waitforTimeout = 60_000
        page.options.waitforInterval = 10
        vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
            contexts: [{ context: 'top-context', url: 'https://example.com', children: [] }]
        } as never)
        const frameElement = getElement.call(page, '//iframe', { [ELEMENT_KEY]: 'iframe-1' })
        vi.spyOn(frameElement, 'isExisting').mockResolvedValue(true)
        vi.spyOn(frameElement, 'waitForExist').mockResolvedValue(true)
        vi.spyOn(page, '$').mockReturnValue(frameElement as never)
        vi.spyOn(page, 'execute').mockResolvedValue({ context: 'frame-1' })

        const child = await page.frame('//iframe')
        expect(child.contextId).toBe('frame-1')
        expect(child.parent?.contextId).toBe('top-context')
    })

    it('types setValue into an element of a held context with key actions', async () => {
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
        const elem = getElement.call(frame, '#input', { [ELEMENT_KEY]: 'elem-1' })
        vi.spyOn(elem, 'execute').mockResolvedValue(undefined)
        const clear = vi.spyOn(elem, 'elementClear')
        const sendKeys = vi.spyOn(elem, 'elementSendKeys')
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

        await elem.setValue('ab')
        expect(elem.execute).toHaveBeenCalledTimes(1)
        expect(perform).toHaveBeenCalledWith({
            context: 'frame-1',
            actions: [{
                id: 'keyboard',
                type: 'key',
                actions: [
                    { type: 'keyDown', value: 'a' },
                    { type: 'keyUp', value: 'a' },
                    { type: 'keyDown', value: 'b' },
                    { type: 'keyUp', value: 'b' }
                ]
            }]
        })
        expect(release).toHaveBeenCalledWith({ context: 'frame-1' })
        expect(clear).not.toHaveBeenCalled()
        expect(sendKeys).not.toHaveBeenCalled()

        await elem.setValue('')
        expect(perform).toHaveBeenLastCalledWith(expect.objectContaining({
            actions: [expect.objectContaining({
                actions: [
                    { type: 'keyDown', value: '\uE003' },
                    { type: 'keyUp', value: '\uE003' }
                ]
            })]
        }))
    })

    it('marks setValue key actions in a held context for masking', async () => {
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
        const elem = getElement.call(frame, '#password', { [ELEMENT_KEY]: 'elem-1' })
        vi.spyOn(elem, 'execute').mockResolvedValue(undefined)
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

        const masked = (call: number) => (perform.mock.calls[call][0] as unknown as Record<symbol, unknown>)[BIDI_MASK]
        expect(typeof BIDI_MASK).toBe('symbol')

        await elem.setValue('secret', { mask: true })
        expect(masked(0)).toBe(true)

        await elem.setValue('visible')
        expect(masked(1)).toBeUndefined()
    })

    it('returns a chainable element from $', () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        const element = page.$('#parent') as { moveTo?: unknown, then?: unknown }
        expect(typeof element.then).toBe('function')
        expect(typeof element.moveTo).toBe('function')
    })

    describe('custom commands', () => {
        type ContextWith<T extends string> = WebdriverIO.BrowsingContext & Record<T, (...args: unknown[]) => Promise<unknown>>

        it('adds a command to contexts from url(), newWindow(), browsingContexts() and frame()', async () => {
            browser.addCommand('whereAmI', async function (this: WebdriverIO.BrowsingContext) {
                return this.contextId
            }, { attachToBrowsingContext: true })

            vi.spyOn(browser, 'browsingContextNavigate').mockResolvedValue({ navigation: 'nav-1', url: 'https://example.com/' })
            vi.spyOn(browser, 'browsingContextCreate').mockResolvedValue({ context: 'new-tab', type: 'tab' } as never)
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{
                    context: 'top-context',
                    url: 'https://example.com',
                    children: [{ context: 'child', url: 'https://child.example', children: [] }]
                }]
            } as never)

            const page = await browser.url('https://example.com') as ContextWith<'whereAmI'>
            const tab = await browser.newWindow('https://webdriver.io', { type: 'tab' }) as ContextWith<'whereAmI'>
            const [listed] = await browser.browsingContexts() as ContextWith<'whereAmI'>[]
            const frame = await listed.frame('https://child.example') as ContextWith<'whereAmI'>

            expect(await page.whereAmI()).toBe('top-context')
            expect(await tab.whereAmI()).toBe('new-tab')
            expect(await listed.whereAmI()).toBe('top-context')
            expect(await frame.whereAmI()).toBe('child')
        })

        it('adds a command to a context that was created before the command was registered', async () => {
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'late'>
            expect(page.late).toBeUndefined()

            browser.addCommand('late', async function (this: WebdriverIO.BrowsingContext, value: string) {
                return `${this.contextId}:${value}`
            }, { attachToBrowsingContext: true })

            expect(await page.late('arg')).toBe('top-context:arg')
        })

        it('does not add a command to a context that was garbage-collected', () => {
            const collected = new Set<object>()
            class FakeWeakRef<T extends object> {
                #target: T
                constructor (target: T) {
                    this.#target = target
                }
                deref () {
                    return collected.has(this.#target) ? undefined : this.#target
                }
            }
            const OriginalWeakRef = globalThis.WeakRef
            globalThis.WeakRef = FakeWeakRef as unknown as WeakRefConstructor
            try {
                const kept = getBrowsingContext(browser, 'kept', { isFrame: false, url: 'https://kept.example' }) as ContextWith<'afterCollect'>
                const gone = getBrowsingContext(browser, 'gone', { isFrame: false, url: 'https://gone.example' }) as ContextWith<'afterCollect'>
                collected.add(gone)

                browser.addCommand('afterCollect', async () => 'ok', { attachToBrowsingContext: true })

                expect(typeof kept.afterCollect).toBe('function')
                expect(gone.afterCollect).toBeUndefined()
            } finally {
                globalThis.WeakRef = OriginalWeakRef
            }
        })

        it('drops the reference of a context once it was garbage-collected, without waiting for another command', () => {
            const finalizers: { cleanup: (held: unknown) => void, held: unknown[] }[] = []
            class FakeFinalizationRegistry<T> {
                #entry: { cleanup: (held: unknown) => void, held: unknown[] }
                constructor (cleanup: (held: T) => void) {
                    this.#entry = { cleanup: cleanup as (held: unknown) => void, held: [] }
                    finalizers.push(this.#entry)
                }
                register (_target: object, held: T) {
                    this.#entry.held.push(held)
                }
            }
            const OriginalRegistry = globalThis.FinalizationRegistry
            globalThis.FinalizationRegistry = FakeFinalizationRegistry as unknown as FinalizationRegistryConstructor
            try {
                const page = getBrowsingContext(browser, 'finalized', { isFrame: false, url: 'https://example.com' }) as ContextWith<'afterFinalize'>
                const [entry] = finalizers
                expect(entry.held).toHaveLength(1)

                /**
                 * the garbage collector reports the context: its reference
                 * leaves the registry right away
                 */
                entry.cleanup(entry.held[0])
                browser.addCommand('afterFinalize', async () => 'ok', { attachToBrowsingContext: true })
                expect(page.afterFinalize).toBeUndefined()
            } finally {
                globalThis.FinalizationRegistry = OriginalRegistry
            }
        })

        it('binds this to the context and gives access to the browser and the parent frame', async () => {
            browser.addCommand('describeContext', async function (this: WebdriverIO.BrowsingContext) {
                return {
                    contextId: this.contextId,
                    isFrame: this.isFrame,
                    parent: this.parent?.contextId,
                    sameBrowser: this.browser === browser
                }
            }, { attachToBrowsingContext: true })

            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example', parent: page }) as ContextWith<'describeContext'>
            expect(await frame.describeContext()).toEqual({
                contextId: 'frame-1',
                isFrame: true,
                parent: 'top-context',
                sameBrowser: true
            })
        })

        it('keeps context commands off the browser and off elements', async () => {
            browser.addCommand('contextOnly', async () => 'context', { attachToBrowsingContext: true })
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'contextOnly'>
            const element = getElement.call(browser, '#foo', { [ELEMENT_KEY]: 'el-1' })

            expect(await page.contextOnly()).toBe('context')
            expect((browser as unknown as Record<string, unknown>).contextOnly).toBeUndefined()
            expect((element as unknown as Record<string, unknown>).contextOnly).toBeUndefined()
        })

        it('rejects attaching to elements and contexts at once, and names that a context already has', () => {
            expect(() => browser.addCommand('both', async () => {}, { attachToElement: true, attachToBrowsingContext: true } as never))
                .toThrow('cannot attach a command to elements and browsing contexts at once')
            expect(() => browser.addCommand('getTitle', async () => {}, { attachToBrowsingContext: true }))
                .toThrow('"getTitle" is already a property of every browsing context')
            expect(() => browser.addCommand('contextId', async () => {}, { attachToBrowsingContext: true }))
                .toThrow('"contextId" is already a property of every browsing context')
            expect(() => browser.addCommand('notAFunction', 'nope' as never, { attachToBrowsingContext: true }))
                .toThrow('must be a function')
        })

        it('rejects names that would make contexts thenable or clash with WebdriverIO internals', () => {
            for (const name of ['then', 'catch', 'finally']) {
                expect(() => browser.addCommand(name, async () => {}, { attachToBrowsingContext: true }))
                    .toThrow(`addCommand: a browsing context command cannot be named "${name}"`)
                expect(() => browser.overwriteCommand(name, async () => {}, { attachToBrowsingContext: true }))
                    .toThrow(`overwriteCommand: a browsing context command cannot be named "${name}"`)
            }
            for (const name of ['__propertiesObject__', '__elementOverrides__', 'constructor', '__proto__']) {
                expect(() => browser.addCommand(name, async () => {}, { attachToBrowsingContext: true }))
                    .toThrow(`a browsing context command cannot be named "${name}"`)
            }
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            expect('then' in page).toBe(false)
        })

        it('overwrites a built-in command on new and existing contexts, including frames', async () => {
            const scriptCallFunction = vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({
                type: 'success',
                result: { type: 'string', value: 'Original Title' }
            } as never)
            const existing = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })

            browser.overwriteCommand('getTitle', async function (this: WebdriverIO.BrowsingContext, origGetTitle) {
                const title = await origGetTitle()
                return `${this.contextId}: ${title}`
            }, { attachToBrowsingContext: true })

            const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
            expect(await existing.getTitle()).toBe('top-context: Original Title')
            expect(await frame.getTitle()).toBe('frame-1: Original Title')
            expect(scriptCallFunction).toHaveBeenCalledWith(expect.objectContaining({ target: { context: 'frame-1' } }))
        })

        it('composes several overrides and overwrites custom context commands', async () => {
            browser.addCommand('greet', async (name: string) => `hello ${name}`, { attachToBrowsingContext: true })
            browser.overwriteCommand('greet' as keyof WebdriverIO.BrowsingContext, async (orig: (name: string) => Promise<string>, name: string) => `${await orig(name)}!`, { attachToBrowsingContext: true })
            browser.overwriteCommand('greet' as keyof WebdriverIO.BrowsingContext, async (orig: (name: string) => Promise<string>, name: string) => (await orig(name)).toUpperCase(), { attachToBrowsingContext: true })

            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'greet'>
            expect(await page.greet('wdio')).toBe('HELLO WDIO!')
        })

        it('throws when overwriting a command that contexts do not have', () => {
            expect(() => browser.overwriteCommand('doesNotExist' as keyof WebdriverIO.BrowsingContext, async () => {}, { attachToBrowsingContext: true }))
                .toThrow('overwriteCommand: no browsing context command to be overwritten: doesNotExist')
        })

        it('keeps the commands of one browser off the contexts of another browser', async () => {
            const other = await remote({ capabilities: { browserName: 'bidi' } })
            browser.addCommand('mine', async () => 'mine', { attachToBrowsingContext: true })

            const own = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'mine'>
            const foreign = getBrowsingContext(other, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'mine'>
            expect(await own.mine()).toBe('mine')
            expect(foreign.mine).toBeUndefined()
        })

        it('runs custom context commands through the command hooks and keeps their errors', async () => {
            const beforeCommand = vi.fn()
            const afterCommand = vi.fn()
            browser.options.beforeCommand = beforeCommand
            browser.options.afterCommand = afterCommand
            browser.addCommand('hooked', async (value: string) => `got ${value}`, { attachToBrowsingContext: true })
            browser.addCommand('broken', async () => {
                throw new Error('boom')
            }, { attachToBrowsingContext: true })

            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' }) as ContextWith<'hooked' | 'broken'>
            expect(await page.hooked('it')).toBe('got it')
            expect(beforeCommand).toHaveBeenCalledWith('hooked', ['it'])
            expect(afterCommand).toHaveBeenCalledWith('hooked', ['it'], 'got it', undefined)
            await expect(page.broken()).rejects.toThrow('boom')
        })

        it('points context.addCommand to the browser option', async () => {
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            await expect(page.addCommand('nope', () => {})).rejects.toThrow(
                'Use `browser.addCommand(name, fn, { attachToBrowsingContext: true })`'
            )
            await expect(page.overwriteCommand('nope', () => {})).rejects.toThrow(
                'Use `browser.overwriteCommand(name, fn, { attachToBrowsingContext: true })`'
            )
        })
    })
})
