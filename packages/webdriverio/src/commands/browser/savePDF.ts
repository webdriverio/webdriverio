/**
 *
 * Save a screenshot of the current browsing context to a PDF file on your OS. Be aware that
 * some browser drivers take screenshots of the whole document (e.g. Geckodriver with Firefox)
 * and others only of the current viewport (e.g. Chromedriver with Chrome).
 *
 * <example>
    :savePDF.js
    it('should save a PDF screenshot of the browser view', function () {
        browser.savePDF('./some/path/screenshot.pdf');
    });
 * </example>
 *
 * @alias browser.savePDF
 * @param   {String}  filepath  path to the generated pdf (`.pdf` suffix is required) relative to the execution directory
 * @return  {Buffer}            screenshot buffer
 * @type utility
 *
 */

import fs from 'fs'
import { getAbsoluteFilepath, assertDirectoryExists } from '../../utils'

export default async function savePDF (this: WebdriverIO.BrowserObject, filepath: string) {
    /**
     * type check
     */
    if (typeof filepath != 'string' || !filepath.endsWith('.pdf')) {
        throw new Error('savePDF expects a filepath of type string and ".pdf" file ending')
    }

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    assertDirectoryExists(absoluteFilepath)

    const pdf = await this.printPage()
    const page = Buffer.from(pdf, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}