import { environment } from '../../environment.js'

/**
 *
 * Download a file from the remote computer running Selenium node to local file system
 * by using the [`downloadFile`](https://webdriver.io/docs/api/selenium#downloadFile) command.
 *
 * :::info
 * Note that this command is only supported if you use a
 * [Selenium Grid](https://www.selenium.dev/documentation/en/grid/) with Chrome, Edge or Firefox
 * and have the `se:downloadsEnabled` flag set in the capabilities.
 * :::
 *
 * <example>
 :downloadFile.js
 it('should download a file', async () => {
        await browser.url('https://www.selenium.dev/selenium/web/downloads/download.html')
        await $('#file-1').click()
        await browser.waitUntil(async function () {
            return (await browser.getDownloadableFiles()).names.includes('file_1.txt')
        }, {timeout: 5000})
        const files = await browser.getDownloadableFiles()
        const downloaded = await browser.downloadFile(files.names[0], process.cwd())
        await browser.deleteDownloadableFiles()
    })
 * </example>
 *
 * @alias browser.downloadFile
 * @param {string} fileName remote path to file
 * @param {string} targetDirectory target location on local computer
 * @type utility
 * @uses protocol/download
 *
 */
export async function downloadFile(
    this: WebdriverIO.Browser,
    fileName: string,
    targetDirectory: string
): Promise<object> {
    /**
     * run command implementation based on given environment
     */
    return environment.value.downloadFile.call(this, fileName, targetDirectory)
}
