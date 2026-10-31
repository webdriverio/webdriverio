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
 * window, call [`switchWindow`](/docs/api/browser/switchWindow).
 *
 * <example>
    :closeWindow.js
    it('should close a tab and continue in the first window', async () => {
        await browser.url('https://webdriver.io')
        await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        await browser.closeWindow()
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
     * `this.closeWindow()` is this function. The classic endpoint is reached by
     * name so the call does not recurse.
     */
    const windowHandles = await runClassicProtocolCommand.call(this, 'closeWindow') as string[] | undefined
    await getContextManager(this).switchToRemainingWindow(windowHandles)
    // typed `void` as the protocol command, but JavaScript callers keep the remaining handles
    return windowHandles as unknown as void
}
