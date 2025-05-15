import { environment } from '../../environment.js'
import type { SaveScreenshotOptions } from '../../types.js'

/**
 *
 * Save a screenshot of the current browsing context to a PNG file on your OS. Be aware that
 * some browser drivers take screenshots of the whole document (e.g. Geckodriver with Firefox)
 * and others only of the current viewport (e.g. Chromedriver with Chrome).
 *
 * <example>
    :saveScreenshot.js
    it('should save a screenshot of the browser viewport', async () => {
        await browser.saveScreenshot('./some/path/screenshot.png');
    });

    it('should save a screenshot of the full page', async () => {
        await browser.saveScreenshot('./some/path/screenshot.png', { fullPage: true });
    });

    it('should save a screenshot of a specific rectangle', async () => {
        await browser.saveScreenshot('./some/path/screenshot.png', { clip: { x: 0, y: 0, width: 100, height: 100 } });
    });

    it('should save a screenshot of the full page in JPEG format', async () => {
        await browser.saveScreenshot('./some/path/screenshot.jpeg', { fullPage: true, format: 'jpeg' });
    });

    it('should save a screenshot of the full page in JPEG format with quality 50', async () => {
        await browser.saveScreenshot('./some/path/screenshot.jpeg', { fullPage: true, format: 'jpeg', quality: 50 });
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
 * @param   {Object}  options   screenshot options
 * @param   {Boolean} [options.fullPage=false]  whether to take a screenshot of the full page or just the current viewport
 * @param   {String}  [options.format='png']    the format of the screenshot (either `png` or `jpeg`)
 * @param   {Number}  [options.quality=100]     the quality of the screenshot in case of JPEG format in range 0-100 percent
 * @param   {Object}  [options.clip]            clipping a rectangle of the screenshot
 * @return  {Buffer}                            screenshot buffer
 * @type utility
 *
 */
export async function saveScreenshot (
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    filepath: string,
    options?: SaveScreenshotOptions
) {
    /**
     * run command implementation based on given environment
     */
    return environment.value.saveScreenshot.call(this, filepath, options)
}
