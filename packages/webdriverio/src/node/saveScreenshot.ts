import fs from 'node:fs/promises'
import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'
import { assertDirectoryExists } from './utils.js'
import { getContextManager } from '../session/context.js'
import { contextIdOf, isBrowsingContext } from '../session/browsingContext.js'
import type { SaveScreenshotOptions } from '../types.js'
/**
 *
 * Save a screenshot of the current browsing context to a PNG file on your OS. Be aware that
 * some browser drivers take screenshots of the whole document (e.g. Geckodriver with Firefox)
 * and others only of the current viewport (e.g. Chromedriver with Chrome).
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', async () => {
        await browser.saveScreenshot('./some/path/screenshot.png');
    });
 * </example>
 *
 * When running from a hook, make sure to explicitly define the hook as async:
 * <example>
    :wdio.conf.js
    afterTest: async function(test) {
        await browser.saveScreenshot('./some/path/screenshot.png');
    }
 * </example>
 * @alias browser.saveScreenshot
 * @param   {String}  filepath  path to the generated image (`.png` suffix is required) relative to the execution directory
 * @return  {Buffer}            screenshot buffer
 * @type utility
 *
 */
export async function saveScreenshot (
    this: WebdriverIO.Browser,
    filepath: string,
    options?: SaveScreenshotOptions
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string') {
        throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
    }

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const screenBuffer = this.isBidi
        ? await takeScreenshotBidi.call(this, filepath, options)
        : await takeScreenshotClassic.call(this, filepath, options)

    const screenshot = Buffer.from(screenBuffer, 'base64')
    await fs.writeFile(absoluteFilepath, screenshot)

    return screenshot
}

/**
 * take screenshot using legacy WebDriver command
 * @returns {string} a base64 encoded screenshot
 */
export function takeScreenshotClassic (this: WebdriverIO.Browser, filepath: string, options?: SaveScreenshotOptions): Promise<string> {
    if (options) {
        throw new Error('saveScreenshot does not support options in WebDriver Classic mode')
    }
    const fileExtension = path.extname(filepath).slice(1)
    if (fileExtension !== 'png') {
        throw new Error('Invalid file extension, use ".png" for PNG format')
    }
    return this.takeScreenshot()
}

/**
 * takeScreenshotBidi
 * @returns {string} a base64 encoded screenshot
 */
async function frameRect (parent: WebdriverIO.BrowsingContext, contextId: string) {
    const frames = await parent.$$('iframe, frame')
    for (const frame of frames) {
        const element = await frame.getElement()
        const win = await parent.execute(
            (node: HTMLIFrameElement) => node.contentWindow,
            element
        ) as { context?: string } | null
        if (win?.context !== contextId) {
            continue
        }
        return parent.execute((node: HTMLElement) => {
            const rect = node.getBoundingClientRect()
            return {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            }
        }, element)
    }
    throw new Error(`Could not find a frame element for browsing context ${contextId}`)
}

export async function takeScreenshotBidi (this: WebdriverIO.Browser | WebdriverIO.BrowsingContext, filepath: string, options?: SaveScreenshotOptions): Promise<string> {
    const browser = getBrowserObject(this)
    const contextManager = getContextManager(browser)
    const context = await contextIdOf(this)
    const tree = await browser.browsingContextGetTree({})
    const origin: remote.BrowsingContextCaptureScreenshotParameters['origin'] = options?.fullPage ? 'document' : 'viewport'
    const givenFormat = options?.format || path.extname(filepath).slice(1)
    const imageFormat = givenFormat === 'png'
        ? 'image/png'
        : givenFormat === 'jpeg' || givenFormat === 'jpg'
            ? 'image/jpeg'
            : undefined

    if (!imageFormat) {
        throw new Error(`Invalid image format, use 'png', 'jpg' or 'jpeg', got '${options?.format}'`)
    }

    if (imageFormat === 'image/jpeg' && path.extname(filepath) !== '.jpeg' && path.extname(filepath) !== '.jpg') {
        throw new Error('Invalid file extension, use ".jpeg" or ".jpg" for JPEG format')
    } else if (imageFormat === 'image/png' && path.extname(filepath) !== '.png') {
        throw new Error('Invalid file extension, use ".png" for PNG format')
    }

    const quality = typeof options?.quality === 'number' ? (options.quality / 100) : undefined
    if (typeof options?.quality === 'number' && (options?.quality < 0 || options?.quality > 100)) {
        throw new Error(`Invalid quality, use a number between 0 and 100, got '${options?.quality}'`)
    }

    if (typeof options?.quality === 'number' && imageFormat !== 'image/jpeg') {
        throw new Error('Invalid option "quality" for PNG format')
    }

    const format: remote.BrowsingContextImageFormat = {
        type: imageFormat,
        quality
    }

    const clip: remote.BrowsingContextBoxClipRectangle | undefined = options?.clip
        ? {
            type: 'box',
            x: options.clip.x,
            y: options.clip.y,
            width: options.clip.width,
            height: options.clip.height
        }
        : undefined
    if (clip) {
        if (typeof clip.x !== 'number' || typeof clip.y !== 'number' || typeof clip.width !== 'number' || typeof clip.height !== 'number') {
            throw new Error('Invalid clip, use an object with x, y, width and height properties')
        }
    }

    if (isBrowsingContext(this) && this.isFrame) {
        let top: WebdriverIO.BrowsingContext = this
        const chain: WebdriverIO.BrowsingContext[] = []
        while (top.parent) {
            chain.unshift(top)
            top = top.parent
        }
        let x = 0
        let y = 0
        let parent = top
        for (const child of chain) {
            const rect = await frameRect(parent, child.contextId)
            x += rect.x
            y += rect.y
            parent = child
        }
        const html = await this.execute(() => {
            const rect = document.documentElement.getBoundingClientRect()
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        })
        const shot = await browser.browsingContextCaptureScreenshot({
            context: top.contextId,
            origin: 'viewport',
            format,
            clip: {
                type: 'box',
                x: Math.round(x + html.x),
                y: Math.round(y + html.y),
                width: Math.round(html.width),
                height: Math.round(html.height)
            }
        })
        return shot.data
    }

    /**
     * WebDriver Bidi doesn't allow to take a screenshot of an iframe, it fails with:
     * "unsupported operation - Non-top-level 'context'". Therefor we need to check if
     * we are within an iframe and if so, take a screenshot of the document element
     * instead.
     */
    const { data } = contextManager.findParentContext(context, tree.contexts)
        ? await browser.$('html').getElement().then(
            (el) => browser.takeElementScreenshot(el.elementId).then((screen) => ({ data: screen })))
        : await browser.browsingContextCaptureScreenshot({ context, origin, format, clip })
    return data
}

