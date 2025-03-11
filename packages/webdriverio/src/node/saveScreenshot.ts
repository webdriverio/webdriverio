import fs from 'node:fs/promises'
import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'
import { getAbsoluteFilepath, assertDirectoryExists } from './utils.js'
import { getContextManager } from '../session/context.js'
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

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const screenBuffer = this.isBidi
        ? await takeScreenshotBidi.call(this, options)
        : await takeScreenshotClassic.call(this, options)

    const screenshot = Buffer.from(screenBuffer, 'base64')
    await fs.writeFile(absoluteFilepath, screenshot)

    return screenshot
}

/**
 * take screenshot using legacy WebDriver command
 * @returns {string} a base64 encoded screenshot
 */
export function takeScreenshotClassic (this: WebdriverIO.Browser, options?: SaveScreenshotOptions): Promise<string> {
    if (options) {
        throw new Error('saveScreenshot does not support options in WebDriver Classic mode')
    }
    return this.takeScreenshot()
}

/**
 * takeScreenshotBidi
 * @returns {string} a base64 encoded screenshot
 */
export async function takeScreenshotBidi (this: WebdriverIO.Browser, options?: SaveScreenshotOptions): Promise<string> {
    const browser = getBrowserObject(this)
    const contextManager = getContextManager(browser)
    const context = await contextManager.getCurrentContext()
    const tree = await this.browsingContextGetTree({})

    const origin: remote.BrowsingContextCaptureScreenshotParameters['origin'] = options?.fullPage ? 'document' : 'viewport'
    const imageFormat = (options?.format || 'png') === 'png'
        ? 'image/png'
        : options?.format === 'jpeg'
            ? 'image/jpeg'
            : undefined

    if (!imageFormat) {
        throw new Error(`Invalid image format, use 'png' or 'jpeg', got '${options?.format}'`)
    }

    const quality = options?.quality || undefined
    if (typeof quality !== 'undefined' && (typeof quality !== 'number' || (quality < 0 || quality > 100))) {
        throw new Error(`Invalid quality, use a number between 0 and 100, got '${quality}'`)
    }

    const format: remote.BrowsingContextImageFormat = {
        type: imageFormat,
        quality: options?.quality
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

    /**
     * WebDriver Bidi doesn't allow to take a screenshot of an iframe, it fails with:
     * "unsupported operation - Non-top-level 'context'". Therefor we need to check if
     * we are within an iframe and if so, take a screenshot of the document element
     * instead.
     */
    const { data } = contextManager.findParentContext(context, tree.contexts)
        ? await browser.$('html').getElement().then(
            (el) => this.takeElementScreenshot(el.elementId).then((data) => ({ data })))
        : await this.browsingContextCaptureScreenshot({ context, origin, format, clip })
    return data
}

