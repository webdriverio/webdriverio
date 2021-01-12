import type { Browser, MultiRemoteBrowser } from '../../types'

/**
 *
 * Pauses execution for a specific amount of time. It is recommended to not use this command to wait for an
 * element to show up. In order to avoid flaky test results it is better to use commands like
 * [`waitForExist`](/docs/api/element/waitForExist.html) or other waitFor* commands.
 *
 * <example>
    :pause.js
    it('should pause the execution', () => {
        const starttime = new Date().getTime()
        browser.pause(3000)
        const endtime = new Date().getTime()
        console.log(endtime - starttime) // outputs: 3000
    });
 * </example>
 *
 * @alias browser.pause
 * @param {Number} milliseconds time in ms
 * @type utility
 *
 */
export default function pause (
    this: Browser | MultiRemoteBrowser,
    milliseconds = 1000
) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
