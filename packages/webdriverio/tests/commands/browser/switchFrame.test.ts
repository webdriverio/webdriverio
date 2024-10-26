import path from 'node:path'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { getContextManager } from '../../../src/context.js'

let browser: WebdriverIO.Browser

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/context.ts', () => {
    const manager = {
        getCurrentContext: vi.fn().mockResolvedValue('5D4662C2B4465334DFD34239BA1E9E66'),
        setCurrentContext: vi.fn(),
        initialize: vi.fn()
    }
    return { getContextManager: () => manager }
})

const contextManager = getContextManager({} as any)

describe('switchFrame command', () => {
    beforeEach(async () => {
        vi.mocked(contextManager.initialize).mockClear()
        vi.mocked(contextManager.setCurrentContext).mockClear()
        vi.mocked(contextManager.getCurrentContext).mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const execute = vi.spyOn(browser, 'execute')
        execute.mockResolvedValue('https://jkl.com')
        const browsingContextActivate = vi.spyOn(browser, 'browsingContextActivate')
        browsingContextActivate.mockResolvedValue({})
        const getWindowHandle = vi.spyOn(browser, 'getWindowHandle')
        getWindowHandle.mockResolvedValue('5D4662C2B4465334DFD34239BA1E9E66')
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

    it('should switch context via string', async () => {
        await browser.switchFrame('https://mno.com')
        expect(contextManager.setCurrentContext).toBeCalledWith('5')
        await browser.switchFrame('jkl')
        expect(contextManager.setCurrentContext).toBeCalledWith('4')
        await browser.switchFrame('3')
        expect(contextManager.setCurrentContext).toBeCalledWith('3')
    })

    it('should switch context via element', async () => {
        await browser.switchFrame(browser.$('iframe'))
        expect(contextManager.setCurrentContext).toBeCalledWith('4')
    })

    it('should switch context via function', async () => {
        await browser.switchFrame((ctx: { url: string }) => Promise.resolve(ctx.url === 'https://mno.com'))
        expect(contextManager.setCurrentContext).toBeCalledWith('5')
    })

    it('should switch context via null', async () => {
        await browser.switchFrame(null)
        expect(contextManager.setCurrentContext).toBeCalledWith('5D4662C2B4465334DFD34239BA1E9E66')
    })
})
