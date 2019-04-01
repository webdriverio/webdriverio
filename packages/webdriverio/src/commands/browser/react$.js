/**
 *
 * Pauses execution for a specific amount of time. It is recommended to not use this command to wait for an
 * element to show up. In order to avoid flaky test results it is better to use commands like
 * [`waitforExist`](/docs/api/element/waitForExist.html) or other waitFor* commands.
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
import fs from 'fs'
import { getElement } from '../../utils/getElementObject'
import { waitToLoadReact, react$ as react$Script } from '../../scripts/resq'

const resqScript = fs.readFileSync(require.resolve('resq'))

export default async function react$ (selector, props) {
    await this.executeScript(resqScript.toString(), [])
    await this.execute(waitToLoadReact)
    const res = await this.execute(react$Script, selector, props)

    if  (!res) {
        throw new Error(`React element with selector "${selector.toString()}" wasn't found`)
    }

    return getElement.call(this, selector, res)
}
