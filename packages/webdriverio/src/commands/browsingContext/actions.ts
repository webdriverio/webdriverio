import type { KeyAction, PointerAction, WheelAction } from '../../utils/bidi/actions/index.js'

/**
 * Allows to run multiple action interaction at once, e.g. to simulate a pinch zoom.
 * For more information on the `action` command, check out the [docs](/docs/api/browser/action).
 *
 * <example>
    :action.js
    it('run multiple actions at once for a pinch zoom', async () => {
        const page = await browser.url('https://webdriver.io')
        await page.actions([
            page.action('pointer')
                .move(500, 500)
                .down()
                .move(250, 250)
                .up(),
            page.action('pointer')
                .move(500, 500)
                .down()
                .move(750, 750)
                .up()
        ])
    });
 * </example>
 *
 * @alias page.actions
 * @type utility
 *
 */
export async function actions (
    this: WebdriverIO.BrowsingContext,
    actions: (KeyAction | PointerAction | WheelAction)[],
): Promise<void> {
    await this.browser.inputPerformActions({
        context: this.contextId,
        actions: actions.map((action) => action.toJSON())
    })
    await this.browser.inputReleaseActions({
        context: this.contextId
    })
}
