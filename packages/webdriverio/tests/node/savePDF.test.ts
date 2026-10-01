import fs from 'node:fs'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { savePDF } from '../../src/node/savePDF.js'
import { getContextManager } from '../../src/session/context.js'

vi.mock('node:fs', () => ({
    default: {
        writeFileSync: vi.fn()
    }
}))

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue(undefined)
    }
}))

vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockReturnValue({
        getCurrentContext: vi.fn().mockResolvedValue('context-1'),
        findParentContext: vi.fn().mockReturnValue(undefined)
    })
}))

const pdfBase64 = Buffer.from('%PDF-classic').toString('base64')
const bidiBase64 = Buffer.from('%PDF-bidi').toString('base64')

function classicBrowser () {
    return {
        isBidi: false,
        printPage: vi.fn().mockResolvedValue(pdfBase64),
        browsingContextPrint: vi.fn(),
        browsingContextGetTree: vi.fn()
    } as unknown as WebdriverIO.Browser & {
        printPage: ReturnType<typeof vi.fn>
        browsingContextPrint: ReturnType<typeof vi.fn>
        browsingContextGetTree: ReturnType<typeof vi.fn>
    }
}

function bidiBrowser () {
    return {
        isBidi: true,
        printPage: vi.fn(),
        browsingContextPrint: vi.fn().mockResolvedValue({ data: bidiBase64 }),
        browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [] })
    } as unknown as WebdriverIO.Browser & {
        printPage: ReturnType<typeof vi.fn>
        browsingContextPrint: ReturnType<typeof vi.fn>
        browsingContextGetTree: ReturnType<typeof vi.fn>
    }
}

describe('savePDF', () => {
    beforeEach(() => {
        vi.mocked(fs.writeFileSync).mockClear()
        const contextManager = getContextManager({} as WebdriverIO.Browser)
        vi.mocked(contextManager.getCurrentContext).mockReset()
        vi.mocked(contextManager.getCurrentContext).mockResolvedValue('context-1')
        vi.mocked(contextManager.findParentContext).mockReset()
        vi.mocked(contextManager.findParentContext).mockReturnValue(undefined)
    })

    it('rejects a path that does not end in .pdf', async () => {
        const browser = classicBrowser()
        const expectedError = new Error('savePDF expects a filepath of type string and ".pdf" file ending')

        await expect(
            // @ts-expect-error test invalid parameter
            savePDF.call(browser)
        ).rejects.toEqual(expectedError)
        await expect(savePDF.call(browser, './file.txt')).rejects.toEqual(expectedError)
        expect(browser.printPage).not.toHaveBeenCalled()
        expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    describe('WebDriver Classic', () => {
        it('calls printPage with the positional arguments and writes the decoded payload', async () => {
            const browser = classicBrowser()
            const pdf = await savePDF.call(browser, './page.pdf')

            expect(browser.printPage).toHaveBeenCalledWith(
                undefined, undefined, undefined, undefined, undefined,
                undefined, undefined, undefined, undefined, undefined, undefined
            )
            expect(browser.browsingContextPrint).not.toHaveBeenCalled()
            expect(pdf.toString()).toBe('%PDF-classic')
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                path.resolve('./page.pdf'),
                expect.any(Buffer)
            )
        })

        it('forwards every print option in the classic argument order', async () => {
            const browser = classicBrowser()
            await savePDF.call(browser, './page.pdf', {
                orientation: 'landscape',
                scale: 0.5,
                background: true,
                width: 10,
                height: 20,
                top: 1,
                bottom: 2,
                left: 3,
                right: 4,
                shrinkToFit: false,
                pageRanges: ['1-2', 3]
            })

            expect(browser.printPage).toHaveBeenCalledWith(
                'landscape',
                0.5,
                true,
                10,
                20,
                1,
                2,
                3,
                4,
                false,
                ['1-2', 3]
            )
            expect(browser.browsingContextPrint).not.toHaveBeenCalled()
        })
    })

    describe('WebDriver BiDi', () => {
        it('calls browsingContextPrint with the current context and writes the decoded data', async () => {
            const browser = bidiBrowser()
            const pdf = await savePDF.call(browser, './page.pdf')

            expect(browser.browsingContextPrint).toHaveBeenCalledWith({ context: 'context-1' })
            expect(browser.printPage).not.toHaveBeenCalled()
            expect(pdf.toString()).toBe('%PDF-bidi')
            const written = vi.mocked(fs.writeFileSync).mock.calls.at(-1)?.[1] as Buffer
            expect(written.toString()).toBe('%PDF-bidi')
        })

        it('maps defined options and omits empty page and margin objects', async () => {
            const browser = bidiBrowser()
            await savePDF.call(browser, './page.pdf', {
                orientation: 'landscape',
                scale: 0.5,
                background: true,
                shrinkToFit: false,
                pageRanges: ['1-2', 3]
            })

            expect(browser.browsingContextPrint).toHaveBeenCalledWith({
                context: 'context-1',
                orientation: 'landscape',
                scale: 0.5,
                background: true,
                shrinkToFit: false,
                pageRanges: ['1-2', 3]
            })

            await savePDF.call(browser, './page.pdf', { width: 10 })
            expect(browser.browsingContextPrint).toHaveBeenLastCalledWith({
                context: 'context-1',
                page: { width: 10 }
            })

            await savePDF.call(browser, './page.pdf', { left: 2, bottom: 3 })
            expect(browser.browsingContextPrint).toHaveBeenLastCalledWith({
                context: 'context-1',
                margin: { left: 2, bottom: 3 }
            })
        })

        it('prints the top-level browsing context when the current context is a frame', async () => {
            const browser = bidiBrowser()
            const contextManager = getContextManager(browser)
            vi.mocked(contextManager.getCurrentContext).mockResolvedValueOnce('frame-1')
            vi.mocked(contextManager.findParentContext).mockImplementation((contextId: string) => {
                if (contextId === 'frame-1') {
                    return { context: 'top-1' } as never
                }
                return undefined
            })

            await savePDF.call(browser, './page.pdf', { orientation: 'portrait' })

            expect(browser.browsingContextPrint).toHaveBeenCalledWith({
                context: 'top-1',
                orientation: 'portrait'
            })
        })

        it('does not fall back to printPage when browsingContext.print is unsupported', async () => {
            const browser = bidiBrowser()
            browser.browsingContextPrint.mockRejectedValue(new Error('unsupported operation'))

            await expect(savePDF.call(browser, './page.pdf')).rejects.toThrow('unsupported operation')
            expect(browser.printPage).not.toHaveBeenCalled()
            expect(fs.writeFileSync).not.toHaveBeenCalled()
        })
    })

    it('rejects an orientation other than portrait or landscape', async () => {
        const browser = bidiBrowser()
        await expect(savePDF.call(browser, './page.pdf', {
            orientation: 'sideways'
        })).rejects.toThrow('savePDF expects orientation to be "portrait" or "landscape", received "sideways"')
        expect(browser.browsingContextPrint).not.toHaveBeenCalled()
        expect(browser.printPage).not.toHaveBeenCalled()
    })

    it('treats null options as omitted', async () => {
        const bidi = bidiBrowser()
        await savePDF.call(bidi, './page.pdf', null)
        expect(bidi.browsingContextPrint).toHaveBeenCalledWith({ context: 'context-1' })

        const classic = classicBrowser()
        await savePDF.call(classic, './page.pdf', null)
        expect(classic.printPage).toHaveBeenCalledWith(
            undefined, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, undefined
        )
    })
})
