import { describe, it, expect, vi } from 'vitest'

import { saveScreenshot } from '../../src/node/saveScreenshot.js'
import { getContextManager } from '../../src/session/context.js'

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn()
    }
}))

vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockReturnValue({
        getCurrentContext: vi.fn().mockResolvedValue('context'),
        findParentContext: vi.fn().mockResolvedValue({ data: 'bidi screenshot' })
    })
}))

const browserClassic = {
    isBidi: false,
    takeScreenshot: vi.fn().mockResolvedValue(btoa('classic screenshot'))
} as unknown as WebdriverIO.Browser

const browserBidi = {
    isBidi: true,
    $: vi.fn().mockReturnValue({
        getElement: vi.fn().mockResolvedValue({ elementId: 'elementId' })
    }),
    takeElementScreenshot: vi.fn().mockResolvedValue(btoa('bidi iframe screenshot')),
    browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [] }),
    browsingContextCaptureScreenshot: vi.fn().mockResolvedValue({ data: btoa('bidi screenshot') })
} as unknown as WebdriverIO.Browser

describe('saveScreenshot', () => {
    describe('WebDriver Classic mode', () => {
        it('should save a screenshot of the browser viewport', async () => {
            const screenshot = await saveScreenshot.call(browserClassic, 'screenshot.png')
            expect(screenshot.toString()).toBe('classic screenshot')
        })

        it('should fail if options are provided', async () => {
            await expect(saveScreenshot.call(browserClassic, 'screenshot.png', { fullPage: true })).rejects.toThrow()
        })
    })

    describe('WebDriver Bidi mode', () => {
        it('should save a screenshot of an iframe', async () => {
            const screenshot = await saveScreenshot.call(browserBidi, 'screenshot.png')
            expect(screenshot.toString()).toBe('bidi iframe screenshot')
        })

        it('should save a screenshot of the full page', async () => {
            const contextManager = getContextManager(browserBidi)
            vi.mocked(contextManager.findParentContext).mockReturnValue(undefined)
            const screenshot = await saveScreenshot.call(browserBidi, 'screenshot.png', { fullPage: true })
            expect(screenshot.toString()).toBe('bidi screenshot')
            expect(browserBidi.browsingContextCaptureScreenshot).toHaveBeenCalledWith({
                context: 'context',
                origin: 'document',
                format: {
                    type: 'image/png',
                    quality: undefined
                },
                clip: undefined
            })
        })

        it('should save a screenshot of a specific rectangle', async () => {
            const screenshot = await saveScreenshot.call(browserBidi, 'screenshot.png', { clip: { x: 10, y: 10, width: 100, height: 100 } })
            expect(screenshot.toString()).toBe('bidi screenshot')
            expect(browserBidi.browsingContextCaptureScreenshot).toHaveBeenCalledWith({
                context: 'context',
                origin: 'viewport',
                clip: {
                    type: 'box',
                    x: 10,
                    y: 10,
                    width: 100,
                    height: 100
                },
                format: {
                    type: 'image/png',
                    quality: undefined
                }
            })
        })

        it('should throw an error if the image format is invalid', async () => {
            // @ts-expect-error invalid format
            await expect(saveScreenshot.call(browserBidi, 'screenshot.png', { format: 'invalid' })).rejects.toThrow()
        })

        it('should throw an error if the file extension is invalid', async () => {
            await expect(saveScreenshot.call(browserBidi, 'screenshot.jpeg', { format: 'png' })).rejects.toThrow()
        })

        it('should throw an error if the file extension is invalid for JPEG format', async () => {
            await saveScreenshot.call(browserBidi, 'screenshot.jpeg')
            await expect(saveScreenshot.call(browserBidi, 'screenshot.exe', { format: 'jpeg' })).rejects.toThrow()
        })

        it('should throw an error if the quality is invalid', async () => {
            await expect(saveScreenshot.call(browserBidi, 'screenshot.png', { quality: 101 }))
                .rejects.toThrow(/Invalid quality, use a number between 0 and 100,/)
            await expect(saveScreenshot.call(browserBidi, 'screenshot.png', { quality: 50 }))
                .rejects.toThrow(/Invalid option "quality" for PNG format/)
        })

        it('should throw an error if the clip is invalid', async () => {
            // @ts-expect-error invalid clip
            await expect(saveScreenshot.call(browserBidi, 'screenshot.png', { clip: { x: 'invalid' } })).rejects.toThrow()
        })
    })
})
