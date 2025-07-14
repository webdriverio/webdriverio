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
        initialize: vi.fn(),
        findContext: vi.fn().mockImplementation((search, contexts, strategy) => {
            if (strategy === 'byUrl' && search === 'https://mno.com') {
                return { context: '5', url: 'https://mno.com' }
            }
            return undefined
        })
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

        it('should switch context for delayed iframe URL', async () => {
            const resolvedTree = {
                '1': {
                    context: '1',
                    parent: null,
                    url: 'https://abc.com',
                    clientWindow: 'window-1',
                    originalOpener: null,
                    userContext: 'default',
                    children: ['5']
                },
                '5': {
                    context: '5',
                    parent: '1',
                    url: 'https://mno.com',
                    clientWindow: 'window-5',
                    originalOpener: null,
                    userContext: 'default',
                    children: []
                }
            }

            const sessionContext = getContextManager(browser)

            // Mock `browsingContextGetTree` to simulate retry behavior
            let getTreeCall = 0
            const browsingContextGetTreeMock = vi
                .spyOn(browser, 'browsingContextGetTree')
                .mockImplementation(() => {
                    getTreeCall++
                    if (getTreeCall < 3) {
                        return Promise.resolve({ contexts: [] }) // 1st & 2nd retries
                    }
                    return Promise.resolve({
                        contexts: [{ context: '5', url: 'https://mno.com', children: [] }]
                    }) // 3rd call resolves
                })

            // `findContext` returns match only on 3rd call
            let findCall = 0
            vi.spyOn(sessionContext, 'findContext').mockImplementation((ctx, contexts, strategy) => {
                findCall++
                if (
                    strategy === 'byUrl' &&
                    findCall >= 3 &&
                    Array.isArray(contexts) &&
                    contexts.some(c => c.url === 'https://mno.com')
                ) {
                    return { context: '5', url: 'https://mno.com' }
                }
                return undefined
            })

            // After resolving, context tree is fetched
            const getFlatContextTreeMock = vi
                .spyOn(sessionContext, 'getFlatContextTree')
                .mockResolvedValue(resolvedTree)

            // Locate iframe node in DOM
            vi.spyOn(browser, 'browsingContextLocateNodes').mockResolvedValue({
                nodes: [{
                    sharedId: 'node-5',
                    value: {
                        nodeType: 1,
                        childNodeCount: 0,
                        attributes: { src: 'https://mno.com' }
                    }
                }]
            })

            // Resolve context from iframe node
            vi.spyOn(browser, 'scriptCallFunction').mockResolvedValue({
                type: 'success',
                result: { type: 'window', value: { context: '5' } }
            })

            // Ensure switchToFrame is called
            const switchToFrameMock = vi
                .spyOn(browser, 'switchToFrame')
                .mockResolvedValue(undefined)

            // Execute
            const result = await browser.switchFrame('https://mno.com')
            expect(result).toBe('5')

            // Assertions
            expect(browsingContextGetTreeMock).toHaveBeenCalledTimes(3) // Ensures retries
            expect(getFlatContextTreeMock).toHaveBeenCalledTimes(1)
            expect(switchToFrameMock).toHaveBeenCalled()
        })

    })
})
