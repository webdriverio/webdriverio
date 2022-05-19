import fs from 'node:fs'
import { getAbsoluteFilepath, assertDirectoryExists } from '../../utils/index.js'

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
export default async function saveScreenshot (
    this: WebdriverIO.Element,
    filepath: string
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.png')) {
        throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
    }

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    assertDirectoryExists(absoluteFilepath)

    const screenBuffer = await this.takeElementScreenshot(this.elementId)
    const screenshot = Buffer.from(screenBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, screenshot)

    return screenshot
}
