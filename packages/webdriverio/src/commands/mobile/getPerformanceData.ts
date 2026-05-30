import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get performance data for a specific application. Returns system state information like cpu,
 * memory, network traffic, and battery. Use `getPerformanceDataTypes()` to find available
 * data types.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :getPerformanceData.js
    it('should get performance data for an app', async () => {
        // Get available data types first
        const types = await browser.getPerformanceDataTypes()
        // Get CPU info for an app
        const cpuData = await browser.getPerformanceData('com.example.app', 'cpuinfo', 5)
    })
 * </example>
 *
 * @param {string}  packageName        The package name of the application to get performance data for
 * @param {string}  dataType           The type of performance data to retrieve (e.g. cpuinfo, memoryinfo)
 * @param {number}  [dataReadTimeout]  Timeout in seconds to wait for the data to be read
 *
 * @returns {`Promise<string[]>`} Performance data for the requested type
 *
 * @support ["android"]
 */
export async function getPerformanceData(
    this: WebdriverIO.Browser,
    packageName: string,
    dataType: string,
    dataReadTimeout?: number
): Promise<string[]> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getPerformanceData` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getPerformanceData` command is only available for Android.')
    }

    try {
        return await browser.execute('mobile: getPerformanceData', { packageName, dataType, dataReadTimeout }) as string[]
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: getPerformanceData', '/appium/getPerformanceData')
        return browser.appiumGetPerformanceData(packageName, dataType, dataReadTimeout) as Promise<string[]>
    }
}
