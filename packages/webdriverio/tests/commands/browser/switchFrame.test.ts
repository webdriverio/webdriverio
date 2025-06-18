import path from 'node:path'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { getContextManager } from '../../../src/session/context.js'
import { ELEMENT_KEY } from 'webdriver'

let browser: WebdriverIO.Browser

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.ts', () => {
    const manager = {
        getCurrentContext: vi.fn().mockResolvedValue('5D4662C2B4465334DFD34239BA1E9E66'),
        setCurrentContext: vi.fn(),
        getFlatContextTree: vi.fn().mockResolvedValue([]),
        initialize: vi.fn()
    }
    return { getContextManager: () => manager }
})

const contextManager = getContextManager({ on: vi.fn() } as any)

describe('switchFrame command', () => {
    describe('non bidi', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('fails when applying a function parameter', async () => {
            await expect(
                browser.switchFrame((ctx: { url: string }) => Promise.resolve(ctx.url === 'https://mno.com'))
            ).rejects.toThrow('Cannot use a function to fetch a context in WebDriver Classic')
        })

        it('fails when applying a string parameter', async () => {
            await expect(
                browser.switchFrame('https://mno.com')
            ).rejects.toThrow('Cannot use a string to fetch a context in WebDriver Classic')
        })

        it('calls classic switchToFrame', async () => {
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            await browser.switchFrame(await browser.$('iframe'))
            expect(switchToFrame).toHaveBeenCalledWith(
                expect.objectContaining({
                    elementId: 'some-elem-123'
                })
            )
        })

        it('should switch context via unresolved WDIO element', async () => {
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            await browser.switchFrame(browser.$('iframe'))
            expect(switchToFrame).toHaveBeenCalledWith(
                expect.objectContaining({
                    [ELEMENT_KEY]: 'some-elem-123'
                })
            )
        })

        it('switch to parent frame', async () => {
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            await browser.switchFrame(null)
            expect(switchToFrame).toHaveBeenCalledWith(null)
        })
    })

    describe('bidi', () => {
        beforeEach(async () => {
            vi.mocked(contextManager.initialize).mockClear()
            vi.mocked(contextManager.setCurrentContext).mockClear()
            vi.mocked(contextManager.getCurrentContext).mockClear()

            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })

            const execute = vi.spyOn(browser, 'execute')
            execute.mockResolvedValue({
                context: '5D4662C2B4465334DFD34239BA1E9E66'
            })
            const browsingContextActivate = vi.spyOn(browser, 'browsingContextActivate')
            browsingContextActivate.mockResolvedValue({})
            const getWindowHandle = vi.spyOn(browser, 'getWindowHandle')
            getWindowHandle.mockResolvedValue('5D4662C2B4465334DFD34239BA1E9E66')
            const browsingContextLocateNodes = vi.spyOn(browser, 'browsingContextLocateNodes')
            browsingContextLocateNodes.mockResolvedValue({
                nodes: []
            })
            const browsingContextGetTree = vi.spyOn(browser, 'browsingContextGetTree')
            browsingContextGetTree.mockResolvedValue({
                contexts: [{
                    children: [{
                        children: [],
                        context: '2',
                        url: 'https://def.com',
                        userContext: 'default'
                    }, {
                        children: [{
                            children: [{
                                children: [],
                                context: '5',
                                url: 'https://mno.com',
                                userContext: 'default'
                            }],
                            context: '4',
                            url: 'https://jkl.com',
                            userContext: 'default'
                        }],
                        context: '3',
                        url: 'https://3.com',
                        userContext: 'default'
                    }],
                    context: '1',
                    url: 'https://abc.com',
                    userContext: 'default'
                }]
            })
        })

        it('should switch context via element', async () => {
            const elem = await browser.$('iframe')
            const elemExecute = vi.spyOn(elem, 'execute')
            elemExecute.mockResolvedValue({
                context: '5D4662C2B4465334DFD34239BA1E9E66'
            })
            vi.spyOn(elem, 'waitForExist').mockResolvedValue(true)

            await browser.switchFrame(elem)
            expect(contextManager.setCurrentContext).toBeCalledWith('5D4662C2B4465334DFD34239BA1E9E66')
        })

        it('should switch context via null', async () => {
            await browser.switchFrame(null)
            expect(contextManager.setCurrentContext).toBeCalledWith('5D4662C2B4465334DFD34239BA1E9E66')
        })

        it('should NOT re-resolve if element already has an elementId', async () => {
            // Mock the resolved element
            const resolvedElem = {
                elementId: 'elem-456',
                [ELEMENT_KEY]: 'elem-456',
                selector: 'iframe',
                waitForExist: vi.fn().mockResolvedValue(true),
                isExisting: vi.fn().mockResolvedValue(true),
                isElement: true,
                getElement: vi.fn()
            } as any

            resolvedElem.getElement.mockResolvedValue(resolvedElem)

            const switchToFrame = vi.spyOn(browser, 'switchToFrame').mockResolvedValue(undefined)

            await browser.switchFrame(resolvedElem)

            expect(switchToFrame).toHaveBeenCalledWith(expect.objectContaining({
                [ELEMENT_KEY]: 'elem-456'
            }))
        })

        it('should re-resolve element if elementId is missing', async () => {
            // Mock the resolved element (returned after re-resolving)
            const resolvedElement = {
                selector: 'iframe',
                elementId: 'elem-789',
                [ELEMENT_KEY]: 'elem-789',
                waitForExist: vi.fn().mockResolvedValue(true),
                isExisting: vi.fn().mockResolvedValue(true),
                isElement: true
            }

            // Spy on browser.$ to simulate re-resolving the selector
            const $spy = vi.spyOn(browser, '$').mockResolvedValue(resolvedElement as any)
            const switchToFrame = vi.spyOn(browser, 'switchToFrame').mockResolvedValue(undefined)

            // Fake unresolved element (missing elementId/ELEMENT_KEY)
            const unresolvedElement = {
                selector: 'iframe',
                parent: browser,
                isElement: true,
                elementId: undefined,
                [ELEMENT_KEY]: undefined,
                async getElement() {
                    if (!this.elementId && typeof this.selector === 'string') {
                        const resolved = await this.parent.$(this.selector)
                        this.elementId = resolved.elementId
                        this[ELEMENT_KEY] = resolved[ELEMENT_KEY]
                        return resolved
                    }
                    return this as any
                }
            }

            await browser.switchFrame(unresolvedElement as any)

            // Assert: re-resolution happened and switchToFrame was called with resolved element
            expect($spy).toHaveBeenCalledWith('iframe')
            expect(switchToFrame).toHaveBeenCalledWith(expect.objectContaining({
                [ELEMENT_KEY]: 'elem-789'
            }))
        })
    })
})
