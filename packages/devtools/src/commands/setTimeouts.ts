import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Set Timeouts command sets timeout durations associated with the current session.
 * The timeouts that can be controlled are listed in the table of session timeouts below.
 *
 * @alias browser.setTimeouts
 * @see https://w3c.github.io/webdriver/#dfn-set-timeouts
 * @param {number} implicit  integer in ms for session implicit wait timeout
 * @param {number} pageLoad  integer in ms for session page load timeout
 * @param {number} script    integer in ms for session script timeout
 */
export default async function setTimeouts (
    this: DevToolsDriver,
    { implicit, pageLoad, script }: { implicit: number, pageLoad: number, script: number }
) {
    await this.setTimeouts(implicit, pageLoad, script)
    return null
}
