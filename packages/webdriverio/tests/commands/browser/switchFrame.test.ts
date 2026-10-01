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

        it('should switch context via an item of an unresolved element list', async () => {
            browser.addCommand('frames$$', function (this: WebdriverIO.Browser) {
                return this.$$('iframe')
            })
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')

            await browser.switchFrame(browser.$$('iframe')[0])
            // @ts-expect-error custom command
            await browser.switchFrame(browser.frames$$()[0])

            expect(switchToFrame).toHaveBeenCalledTimes(2)
            for (const [ref] of switchToFrame.mock.calls) {
                expect(ref).toEqual(expect.objectContaining({ [ELEMENT_KEY]: 'some-elem-123' }))
            }
        })

        it('switch to parent frame', async () => {
            const switchToFrame = vi.spyOn(browser, 'switchToFrame')
            await browser.switchFrame(null)
            expect(switchToFrame).toHaveBeenCalledWith(null)
        })
    })

    describe('bidi', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'bidi'
                }
            })
        })

        it('throws and points at context.frame()', async () => {
            await expect(browser.switchFrame(null)).rejects.toThrow('Call `frame()`')
            await expect(browser.switchFrame('https://example.com')).rejects.toThrow('removed for WebDriver BiDi')
        })
    })
})
