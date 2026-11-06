import { runClassicProtocolCommand } from 'webdriver'

import { getContextManager } from '../../session/context.js'

/**
 *
 * Close the current top-level browsing context, e.g. the current tab or window.
 * If it was the last one, the driver ends the session and the command rejects.
 *
 * The command calls the WebDriver [closeWindow](/docs/api/webdriver#closewindow)
 * endpoint, then switches to the first remaining window. It resolves after that
 * switch, so the next command runs in the remaining window. To go to another
 * window in a WebDriver Classic session, call [`switchWindow`](/docs/api/browser/switchWindow).
 *
 * In a WebDriver BiDi session, `newWindow` does not switch to the new tab, so
 * `browser.closeWindow()` closes the current tab and not the new tab. To close
 * the new tab, call `closeWindow()` on the browsing context that `newWindow` returns.
 *
 * <example>
    :closeWindow.js
    it('should close the new tab in a WebDriver Classic session', async () => {
        await browser.url('https://webdriver.io')
        await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        await browser.closeWindow()
        console.log(await browser.getTitle()) // outputs the title of https://webdriver.io
    });

    it('should close the new tab in a WebDriver BiDi session', async () => {
        await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        await tab.closeWindow()
        console.log(await browser.getTitle()) // outputs the title of https://webdriver.io
    });
 * </example>
 *
 * @see https://w3c.github.io/webdriver/#dfn-close-window
 * @alias browser.closeWindow
 * @type protocol
 *
 */
export async function closeWindow (this: WebdriverIO.Browser): Promise<void> {
    /**
     * the driver can only close the current window, so a handle must not close it
     */
    if (arguments.length > 0) {
        throw new Error('Wrong parameters applied for closeWindow\nUsage: closeWindow()')
    }

    /**
     * `this.closeWindow()` is this function. The classic endpoint is reached by
     * name so the call does not recurse.
     */
    const windowHandles = await runClassicProtocolCommand.call(this, 'closeWindow') as string[] | undefined
    await getContextManager(this).switchToRemainingWindow(windowHandles)
    // typed `void` as the protocol command, but JavaScript callers keep the remaining handles
    return windowHandles as unknown as void
}
