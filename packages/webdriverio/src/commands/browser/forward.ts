import { runClassicProtocolCommand } from 'webdriver'

import { traverseTopLevelHistory } from '../../utils/traverseHistory.js'

/**
 *
 * Go one step forward in the joint session history of the current top-level
 * browsing context. This is equivalent to pressing the browser forward button
 * or calling `window.history.forward()`.
 *
 * The command takes no arguments and resolves with no value.
 *
 * On a WebDriver BiDi session it calls
 * [`browsingContext.traverseHistory`](https://w3c.github.io/webdriver-bidi/#command-browsingContext-traverseHistory)
 * with `delta: 1` for the top-level context. A frame selected with
 * [`switchFrame`](/docs/api/browser/switchFrame) does not change that target.
 * After the traversal is accepted, the command waits for the same document
 * readiness [`url`](/docs/api/browser/url) maps from `pageLoadStrategy`:
 *
 * - `none` does not wait
 * - `eager` waits for `browsingContext.domContentLoaded`
 * - `normal` (the default) waits for `browsingContext.load`
 *
 * The wait uses the session page-load timeout (`timeouts.pageLoad`, 300000 ms
 * when it has not been set). A same-document traversal, such as a fragment
 * change, finishes without a load event.
 *
 * A classic session posts to the WebDriver [forward](/docs/api/webdriver#forward)
 * endpoint. There is no next entry in either mode when the command rejects
 * with `no such history entry`.
 *
 * <example>
    :forward.js
    it('should go back and forward', async () => {
        await browser.url('https://webdriver.io')
        await browser.url('https://webdriver.io/docs/gettingstarted')
        await browser.back()
        await browser.forward()
        console.log(await browser.getUrl()) // outputs the second page
    });
 * </example>
 *
 * @see https://w3c.github.io/webdriver/#dfn-forward
 * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-traverseHistory
 * @alias browser.forward
 * @type protocol
 *
 */
export async function forward (this: WebdriverIO.Browser): Promise<void> {
    /**
     * `this.forward()` is this function. The classic endpoint is reached by
     * name so the call does not recurse.
     */
    if (!this.isBidi) {
        await runClassicProtocolCommand.call(this, 'forward')
        return
    }

    await traverseTopLevelHistory(this, 1)
}
