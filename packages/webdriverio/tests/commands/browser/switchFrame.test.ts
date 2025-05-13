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

        it('should handle element from collection with CSS selector', async () => {
            // Create a mock element with index property and CSS selector
            const elem = await browser.$('iframe')
            Object.defineProperty(elem, 'index', { value: 2 })
            Object.defineProperty(elem, 'selector', { value: '.frame-class' })
            vi.spyOn(elem, 'waitForExist').mockResolvedValue(true)

            // Mock the $ method to return a specific element
            const specificElement = {
                waitForExist: vi.fn().mockResolvedValue(true),
                getElement: vi.fn().mockResolvedValue({
                    [ELEMENT_KEY]: 'specific-elem-456'
                })
            }
            const dollarSign = vi.spyOn(browser, '$')
            dollarSign.mockReturnValue(specificElement as any)

            // Mock the execute method
            vi.spyOn(browser, 'execute').mockResolvedValue({
                context: 'FRAME_CONTEXT_ID'
            })

            // Mock the switchToFrame method
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            switchToFrame.mockResolvedValue(undefined)

            // Call the method
            const result = await browser.switchFrame(elem)

            // Verify critical aspects of the function's behavior
            expect(dollarSign).toHaveBeenCalledWith('.frame-class:nth-child(3)')
            expect(specificElement.getElement).toHaveBeenCalled()
            expect(switchToFrame).toHaveBeenCalledWith({
                [ELEMENT_KEY]: 'specific-elem-456'
            })
            expect(contextManager.setCurrentContext).toHaveBeenCalledWith('FRAME_CONTEXT_ID')
            expect(result).toBe('FRAME_CONTEXT_ID')
        })

        it('should handle element from collection with XPath selector', async () => {
            // Create a mock element with index property and XPath locator
            const elem = await browser.$('iframe')
            Object.defineProperty(elem, 'index', { value: 1 })
            Object.defineProperty(elem, 'selector', { value: '//iframe' })
            Object.defineProperty(elem, 'locator', {
                value: {
                    type: 'xpath',
                    value: '//iframe'
                }
            })
            vi.spyOn(elem, 'waitForExist').mockResolvedValue(true)

            // Mock the $ method to return a specific element
            const specificElement = {
                waitForExist: vi.fn().mockResolvedValue(true),
                getElement: vi.fn().mockResolvedValue({
                    [ELEMENT_KEY]: 'xpath-elem-789'
                })
            }
            const dollarSign = vi.spyOn(browser, '$')
            dollarSign.mockReturnValue(specificElement as any)

            // Mock the execute method
            vi.spyOn(browser, 'execute').mockResolvedValue({
                context: 'XPATH_FRAME_CONTEXT'
            })

            // Mock the switchToFrame method
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            switchToFrame.mockResolvedValue(undefined)

            // Call the method
            const result = await browser.switchFrame(elem)

            // Verify critical aspects of the function's behavior
            expect(dollarSign).toHaveBeenCalledWith('(//iframe)[2]')
            expect(specificElement.getElement).toHaveBeenCalled()
            expect(switchToFrame).toHaveBeenCalledWith({
                [ELEMENT_KEY]: 'xpath-elem-789'
            })
            expect(contextManager.setCurrentContext).toHaveBeenCalledWith('XPATH_FRAME_CONTEXT')
            expect(result).toBe('XPATH_FRAME_CONTEXT')
        })
    })
})
