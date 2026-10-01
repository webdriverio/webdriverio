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
})
