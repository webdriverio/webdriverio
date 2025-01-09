import fs from 'node:fs'
import { getBrowserObject } from '@wdio/utils'

import { getContextManager } from '../../session/context.js'
import { getAbsoluteFilepath, assertDirectoryExists } from '../../utils/index.js'

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
    filepath: string
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.png')) {
        throw new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
    }

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    await assertDirectoryExists(absoluteFilepath)

    let screenBuffer: string
    if (this.isBidi) {
        const browser = getBrowserObject(this)
        const contextManager = getContextManager(browser)
        const context = await contextManager.getCurrentContext()
        const { data } = await this.browsingContextCaptureScreenshot({ context })
        screenBuffer = data
    } else {
        screenBuffer = await this.takeScreenshot()
    }
    const screenshot = Buffer.from(screenBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, screenshot)

    return screenshot
}
