import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Returns the information types of the system state which is supported to read
 * as part of performance data (e.g. cpu, memory, network traffic, battery).
 *
 * <example>
    :getPerformanceDataTypes.js
    it('should get the supported performance data types', async () => {
        const types = await browser.getPerformanceDataTypes()
        console.log('Supported types:', types)
    })
 * </example>
 *
 * @returns {`Promise<string[]>`} A list of supported performance data type names
 *
 * @support ["android"]
 */
export async function getPerformanceDataTypes(
    this: WebdriverIO.Browser
): Promise<string[]> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getPerformanceDataTypes` command is only available for mobile platforms.')
    }

    if (!browser.isAndroid) {
        throw new Error('The `getPerformanceDataTypes` command is only available for Android.')
    }

    return executeMobile<string[]>(browser, 'mobile: getPerformanceDataTypes', {})
}
