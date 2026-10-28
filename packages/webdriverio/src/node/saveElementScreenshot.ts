import fs from 'node:fs/promises'
import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'

import { assertDirectoryExists } from './utils.js'
import { isBidiCommandsEnabled } from '../utils/bidi/elementCommands.js'
import { foreignContext } from '../utils/foreignContext.js'

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

    /**
     * The BiDi override lives on the browser-level command. An element of a held
     * frame keeps its element-bound route, which clips within that frame.
     */
    const browser = getBrowserObject(this)
    const screenBuffer = isBidiCommandsEnabled(browser) && !(await foreignContext(this))
        ? await browser.takeElementScreenshot(this.elementId)
        : await this.takeElementScreenshot(this.elementId)
    const screenshot = Buffer.from(screenBuffer, 'base64')
    await fs.writeFile(absoluteFilepath, screenshot)

    return screenshot
}
