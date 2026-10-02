import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

import { BIDI_MASK, ELEMENT_KEY } from 'webdriver'

import { remote } from '../../../src/index.js'
import { getBrowsingContext } from '../../../src/browsingContext.js'
import { getContextManager } from '../../../src/session/context.js'
import { getElement } from '../../../src/utils/getElementObject.js'
import { StrictSelectorError } from '../../../src/utils/strictSelectorError.js'

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
        /**
         * `none` skips the readiness wait, which is covered in traverseHistory tests
         */
        browser.capabilities.pageLoadStrategy = 'none'
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
        vi.spyOn(frame, 'execute').mockResolvedValue(undefined)
        const clear = vi.spyOn(elem, 'elementClear')
        const sendKeys = vi.spyOn(elem, 'elementSendKeys')
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

        await elem.setValue('ab')
        expect(frame.execute).toHaveBeenCalledTimes(1)
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
        vi.spyOn(frame, 'execute').mockResolvedValue(undefined)
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

    describe('commands on another held context', () => {
        /**
         * The session's current context is `top-context` (see the mock above).
         * `tab-2` and `frame-1` are held contexts other than that one.
         */
        const heldElement = (contextId: string, isFrame = false) => {
            const context = getBrowsingContext(browser, contextId, { isFrame, url: 'https://child.example' })
            const elem = getElement.call(context, '#target', { [ELEMENT_KEY]: 'elem-1' })
            return { context, elem }
        }

        it('reads element state in the element\'s own document, not over classic WebDriver', async () => {
            const { context, elem } = heldElement('frame-1', true)
            const execute = vi.spyOn(context, 'execute')
            const classic = {
                isElementEnabled: vi.spyOn(browser, 'isElementEnabled'),
                isElementSelected: vi.spyOn(browser, 'isElementSelected'),
                getElementTagName: vi.spyOn(browser, 'getElementTagName'),
                elementClear: vi.spyOn(browser, 'elementClear')
            }

            execute.mockResolvedValueOnce(false)
            await expect(elem.isEnabled()).resolves.toBe(false)
            execute.mockResolvedValueOnce(true)
            await expect(elem.isSelected()).resolves.toBe(true)
            execute.mockResolvedValueOnce('select')
            await expect(elem.getTagName()).resolves.toBe('select')
            execute.mockResolvedValueOnce(undefined)
            await elem.clearValue()

            expect(execute).toHaveBeenCalledTimes(4)
            for (const call of execute.mock.calls) {
                expect(call[1]).toEqual({ [ELEMENT_KEY]: 'elem-1' })
            }
            for (const spy of Object.values(classic)) {
                expect(spy).not.toHaveBeenCalled()
            }
        })

        it('keeps classic WebDriver for an element of the current context', async () => {
            const elem = getElement.call(browser, '#target', { [ELEMENT_KEY]: 'elem-1' })
            const enabled = vi.spyOn(elem, 'isElementEnabled').mockResolvedValue(true)
            await expect(elem.isEnabled()).resolves.toBe(true)
            expect(enabled).toHaveBeenCalledWith('elem-1')
        })

        it('reports colors of an element in another context as rgba, like the drivers', async () => {
            const { context, elem } = heldElement('tab-2')
            vi.spyOn(context, 'execute').mockResolvedValue('rgb(255, 0, 0)')
            const { value } = await elem.getCSSProperty('color')
            expect(value).toBe('rgba(255,0,0,1)')
        })

        it('appends with addValue without selecting the current value', async () => {
            const { context, elem } = heldElement('frame-1', true)
            const execute = vi.spyOn(context, 'execute').mockResolvedValue(undefined)
            const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
            vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

            await elem.addValue('b')
            expect(execute).toHaveBeenCalledWith(expect.any(Function), { [ELEMENT_KEY]: 'elem-1' }, false)
            expect(perform).toHaveBeenCalledWith(expect.objectContaining({
                context: 'frame-1',
                actions: [expect.objectContaining({
                    actions: [{ type: 'keyDown', value: 'b' }, { type: 'keyUp', value: 'b' }]
                })]
            }))

            perform.mockClear()
            await elem.addValue('')
            expect(perform).not.toHaveBeenCalled()
        })

        it('selects an option by clicking it in the element\'s own document', async () => {
            const { context, elem } = heldElement('tab-2')
            const classicClick = vi.spyOn(browser, 'elementClick')
            const execute = vi.spyOn(context, 'execute').mockImplementation((async (_fn: unknown, ...args: unknown[]) => (
                args.length === 3
                    ? [{ [ELEMENT_KEY]: 'opt-0' }, { [ELEMENT_KEY]: 'opt-1' }]
                    : true
            )) as never)

            await elem.selectByIndex(1)
            expect(execute).toHaveBeenLastCalledWith(expect.any(Function), { [ELEMENT_KEY]: 'opt-1' })
            await elem.selectByAttribute('value', 'two')
            expect(execute).toHaveBeenLastCalledWith(expect.any(Function), { [ELEMENT_KEY]: 'opt-0' })
            expect(classicClick).not.toHaveBeenCalled()
        })

        it('scrolls an element into view before clicking it in another context', async () => {
            const { context, elem } = heldElement('frame-1', true)
            const execute = vi.spyOn(context, 'execute').mockResolvedValue(false)
            vi.spyOn(elem, 'waitForExist').mockResolvedValue(true)
            const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
            vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

            await elem.click()
            expect(execute).toHaveBeenCalledTimes(1)
            expect(execute.mock.invocationCallOrder[0]).toBeLessThan(perform.mock.invocationCallOrder[0])
            expect(perform).toHaveBeenCalledWith(expect.objectContaining({ context: 'frame-1' }))
        })

        it('scrolls an element of a held frame into view before moving to it', async () => {
            const { context, elem } = heldElement('frame-1', true)
            const execute = vi.spyOn(context, 'execute').mockResolvedValue(undefined)
            vi.spyOn(elem, 'waitForExist').mockResolvedValue(true)
            const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
            vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

            await elem.moveTo()
            expect(execute).toHaveBeenCalledWith(expect.any(Function), elem)
            expect(execute.mock.invocationCallOrder[0]).toBeLessThan(perform.mock.invocationCallOrder[0])
            expect(perform).toHaveBeenCalledWith(expect.objectContaining({ context: 'frame-1' }))
        })

        it('rejects computed role and label for an element of another context', async () => {
            const { elem } = heldElement('tab-2')
            await expect(elem.getComputedRole()).rejects.toThrow('not supported for an element of another browsing context')
            await expect(elem.getComputedLabel()).rejects.toThrow('not supported for an element of another browsing context')
        })

        it('emulates in the held tab instead of the current one', async () => {
            const tab = getBrowsingContext(browser, 'tab-2', { isFrame: false, url: 'https://child.example' })
            const override = vi.spyOn(browser, 'emulationSetUserAgentOverride').mockResolvedValue({})
            const restore = await tab.emulate('userAgent', 'agent')
            expect(override).toHaveBeenCalledWith({ userAgent: 'agent', contexts: ['tab-2'] })
            await restore()
            expect(override).toHaveBeenLastCalledWith({ userAgent: null, contexts: ['tab-2'] })
        })

        it('limits a mock of a held tab to that tab and restores it without the window handle', async () => {
            const tab = getBrowsingContext(browser, 'tab-2', { isFrame: false, url: 'https://child.example' })
            vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue({} as never)
            vi.spyOn(browser, 'networkAddDataCollector').mockResolvedValue({ collector: 'c' } as never)
            const addIntercept = vi.spyOn(browser, 'networkAddIntercept').mockResolvedValue({ intercept: 'i-1' })
            vi.spyOn(browser, 'networkRemoveIntercept').mockResolvedValue({})
            const windowHandle = vi.spyOn(browser, 'getWindowHandle')

            const mock = await tab.mock('**/api')
            expect(addIntercept).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['tab-2'] }))
            await expect(mock.restore()).resolves.not.toThrow()
            expect(windowHandle).not.toHaveBeenCalled()

            addIntercept.mockClear()
            await browser.mock('**/session-wide')
            expect(addIntercept.mock.calls[0][0]).not.toHaveProperty('contexts')
        })

        it('restores a mock of a held tab when the tab closes', async () => {
            const tab = getBrowsingContext(browser, 'tab-3', { isFrame: false, url: 'https://child.example' })
            vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue({} as never)
            vi.spyOn(browser, 'networkAddDataCollector').mockResolvedValue({ collector: 'c' } as never)
            vi.spyOn(browser, 'networkAddIntercept').mockResolvedValue({ intercept: 'i-3' })
            const remove = vi.spyOn(browser, 'networkRemoveIntercept').mockResolvedValue({})

            await tab.mock('**/api')
            browser.emit('browsingContext.contextDestroyed', { context: 'other-tab' } as never)
            expect(remove).not.toHaveBeenCalled()
            browser.emit('browsingContext.contextDestroyed', { context: 'tab-3' } as never)
            await vi.waitFor(() => expect(remove).toHaveBeenCalledWith({ intercept: 'i-3' }))
        })

        it('stops watching the tab once a mock of it is restored', async () => {
            const tab = getBrowsingContext(browser, 'tab-3', { isFrame: false, url: 'https://child.example' })
            vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue({} as never)
            vi.spyOn(browser, 'networkAddDataCollector').mockResolvedValue({ collector: 'c' } as never)
            vi.spyOn(browser, 'networkAddIntercept').mockResolvedValue({ intercept: 'i-4' })
            vi.spyOn(browser, 'networkRemoveIntercept').mockResolvedValue({})
            const on = vi.spyOn(browser, 'on')
            const off = vi.spyOn(browser, 'off')

            const mock = await tab.mock('**/api')
            const watch = on.mock.calls.find(([event]) => event === 'browsingContext.contextDestroyed')
            expect(watch).toBeDefined()
            await mock.restore()
            expect(off).toHaveBeenCalledWith('browsingContext.contextDestroyed', watch![1])
        })

        it('treats a plain string as a selector before matching frame urls', async () => {
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            const tree = vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'top-context', url: 'https://example.com', children: [
                    { context: 'frame-1', url: 'https://example.com/plain', children: [
                        { context: 'frame-2', url: 'https://example.com/iframe-nested', children: [] }
                    ] }
                ] }]
            } as never)
            const frameElement = getElement.call(page, 'iframe', { [ELEMENT_KEY]: 'iframe-1' })
            vi.spyOn(frameElement, 'isExisting').mockResolvedValue(true)
            vi.spyOn(frameElement, 'waitForExist').mockResolvedValue(true)
            vi.spyOn(frameElement, 'getTagName').mockResolvedValue('iframe')
            const $ = vi.spyOn(page, '$').mockReturnValue(frameElement as never)
            vi.spyOn(page, 'execute').mockResolvedValue({ context: 'frame-1' })

            const child = await page.frame('iframe')
            expect(child.contextId).toBe('frame-1')
            expect(tree).not.toHaveBeenCalled()

            $.mockImplementation(() => {
                throw new StrictSelectorError('iframe', 2)
            })
            await expect(page.frame('iframe')).rejects.toThrow('strict mode violation')
        })

        it('falls back to frame urls when a string selector finds a non-frame element', async () => {
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'top-context', url: 'https://example.com', children: [
                    { context: 'frame-1', url: 'https://example.com/results.html', children: [] }
                ] }]
            } as never)
            const results = getElement.call(page, 'results', { [ELEMENT_KEY]: 'results-1' })
            vi.spyOn(results, 'isExisting').mockResolvedValue(true)
            vi.spyOn(results, 'getTagName').mockResolvedValue('results')
            vi.spyOn(page, '$').mockReturnValue(results as never)

            const frame = await page.frame('results')
            expect(frame.contextId).toBe('frame-1')
        })

        it('installs the clock in the held tab it was emulated on', async () => {
            const tab = getBrowsingContext(browser, 'tab-2', { isFrame: false, url: 'https://child.example' })
            const execute = vi.spyOn(tab, 'execute').mockResolvedValue(undefined)
            const addInitScript = vi.spyOn(tab, 'addInitScript').mockResolvedValue({ remove: vi.fn() } as never)
            const preload = vi.spyOn(browser, 'scriptAddPreloadScript').mockResolvedValue({ script: 'preload-1' })
            const classic = vi.spyOn(browser, 'executeScript')

            const clock = await tab.emulate('clock', { now: 0 })
            await clock.tick(100)

            expect(preload).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['tab-2'] }))
            expect(addInitScript).toHaveBeenCalledTimes(1)
            expect(execute).toHaveBeenLastCalledWith(expect.any(Function), 100)
            expect(classic).not.toHaveBeenCalled()
        })

        it('reloads a frame from inside it, so the frame keeps its context', async () => {
            const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
            const reload = vi.spyOn(browser, 'browsingContextReload')
            vi.spyOn(frame, 'execute')
                .mockResolvedValueOnce('token')
                .mockResolvedValue({ marker: undefined, ready: 'complete' })

            await frame.refresh()
            expect(reload).not.toHaveBeenCalled()
            expect(frame.execute).toHaveBeenCalledTimes(2)
        })

        it('rejects running a script in a frame whose page navigated away', async () => {
            const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
            const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example', parent: page })
            vi.spyOn(browser, 'browsingContextGetTree').mockResolvedValue({
                contexts: [{ context: 'top-context', url: 'https://example.com/next', children: [] }]
            } as never)
            const scriptCallFunction = vi.spyOn(browser, 'scriptCallFunction')

            await expect(frame.execute(() => document.title)).rejects.toThrow('no such frame')
            expect(scriptCallFunction).not.toHaveBeenCalled()
        })
    })
})
