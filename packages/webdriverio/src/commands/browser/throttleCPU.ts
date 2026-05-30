/**
 * Throttles the CPU to emulate a slower processor.
 *
 * :::info
 *
 * Note that using the `throttleCPU` command requires support for Chrome DevTools protocol and e.g.
 * can not be used when running automated tests in the cloud. Chrome DevTools protocol is not installed by default,
 * use `npm install puppeteer-core` to install it.
 * Find out more in the [Automation Protocols](/docs/automationProtocols) section.
 *
 * :::
 *
 * <example>
    :throttleCPU.js
    it('should throttle the CPU', async () => {
        await browser.throttleCPU(2) // 2x slowdown
    });
 * </example>
 *
 * @alias browser.throttleCPU
 * @param {number}         factor              slowdown factor (1 is no throttle, 2 is 2x slowdown, etc)
 * @type utility
 *
 */

export async function throttleCPU (
    this: WebdriverIO.Browser,
    factor: number
): Promise<void> {
    if (typeof factor !== 'number') {
        throw new Error('Invalid factor for "throttleCPU". Expected it to be a number (int)')
    }

    const failedConnectionMessage = 'No Puppeteer connection could be established which is required to use this command'

    // Connect to Chrome DevTools
    await this.getPuppeteer()
    if (!this.puppeteer) {
        throw new Error(failedConnectionMessage)
    }

    const pages = await this.puppeteer.pages()

    if (!pages.length) {
        throw new Error(failedConnectionMessage)
    }

    const client = await pages[0].target().createCDPSession()

    // Set CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', { rate: factor })
}
