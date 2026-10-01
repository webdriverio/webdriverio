import fs from 'node:fs/promises'
import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'

import { assertDirectoryExists } from './utils.js'
import { frameOffset } from './saveScreenshot.js'
import { foreignContextId, heldBrowsingContext } from '../session/browsingContext.js'

/**
 *
 * Save a screenshot of an element to a PNG file on your OS.
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser view', async () => {
        const elem = await $('#someElem');
        await elem.saveScreenshot('./some/path/elemScreenshot.png');
    });
 * </example>
 *
 * @alias element.saveScreenshot
 * @param   {String}  filename  path to the generated image (`.png` suffix is required) relative to the execution directory
 * @return  {Buffer}            screenshot buffer
 * @type utility
 *
 */
export async function saveElementScreenshot (
    this: WebdriverIO.Element,
    filepath: string
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.png')) {
        throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
    }

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const held = await foreignContextId(this) ? heldBrowsingContext(this) : undefined
    const screenBuffer = held
        ? await takeElementScreenshotInContext(this, held)
        : await this.takeElementScreenshot(this.elementId)
    const screenshot = Buffer.from(screenBuffer, 'base64')
    await fs.writeFile(absoluteFilepath, screenshot)

    return screenshot
}

/**
 * Take Element Screenshot only sees the session's current context. For an
 * element of another held context, measure it in its own document and clip
 * a capture of the top-level context it is shown in.
 */
async function takeElementScreenshotInContext (
    element: WebdriverIO.Element,
    held: WebdriverIO.BrowsingContext
) {
    await element.execute((el: Element) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    const rect = await element.execute((el: Element) => {
        const { x, y, width, height } = el.getBoundingClientRect()
        return { x, y, width, height }
    })
    const { top, x, y } = held.isFrame ? await frameOffset(held) : { top: held, x: 0, y: 0 }
    /**
     * Clip against the whole document, so an element of a frame that reaches
     * past the bottom of the viewport is not cut off.
     */
    const scroll = await top.execute(() => ({ x: window.scrollX, y: window.scrollY }))
    const { data } = await getBrowserObject(element).browsingContextCaptureScreenshot({
        context: top.contextId,
        origin: 'document',
        clip: { type: 'box', x: scroll.x + x + rect.x, y: scroll.y + y + rect.y, width: rect.width, height: rect.height }
    })
    return data
}
