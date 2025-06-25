import { ELEMENT_KEY } from 'webdriver'
import type { WaitForOptions } from '../../types.js'

/**
 *
 * Wait for an element for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element that exists in the DOM, otherwise throws an
 * error. If the reverse flag is true, the command will instead return true
 * if the selector does not match any elements.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the
 * element to exist to execute this command.
 *
 * :::
 *
 * <example>
    :waitForExistSyncExample.js
    it('should display a notification message after successful form submit', async () => {
        const form = await $('form');
        const notification = await $('.notification');
        await form.$(".send").click();
        await notification.waitForExist({ timeout: 5000 });
        expect(await notification.getText()).to.be.equal('Data transmitted successfully!')
    });
    it('should remove a message after successful form submit', async () => {
        const form = await $('form');
        const message = await $('.message');
        await form.$(".send").click();
        await message.waitForExist({ reverse: true });
    });
 * </example>
 *
 * @alias element.waitForExist
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default set based on [`waitforTimeout`](/docs/configuration#waitfortimeout) config value)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} true     if element exists (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isExisting
 * @type utility
 *
 */
export async function waitForExist (
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}existing after ${timeout}ms`
    }: WaitForOptions = {}
) {
    const isExisting = await this.waitUntil(
        async () => reverse !== await this.isExisting(),
        { timeout, interval, timeoutMsg }
    )

    /**
     * If we were waiting for an element to exist and it did, we can update the
     * elementId of the current element and remove the error. This is important
     * as the user may expect to be able to access an element id after it has
     * calling `waitForExist`.
     */
    // only re-resolve if no elementId present (or if known to be stale)
    if (!reverse && isExisting && typeof this.selector === 'string' && !this.elementId) {
        this.elementId = await this.parent.$(this.selector).elementId
        this[ELEMENT_KEY] = this.elementId
        delete this.error
    }

    return isExisting
}
