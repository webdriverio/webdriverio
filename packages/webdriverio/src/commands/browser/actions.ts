import type { KeyAction, PointerAction, WheelAction } from '../../utils/actions/index.js'

/**
 * Allows to run multiple action interaction at once, e.g. to simulate a pinch zoom.
 * For more information on the `action` command, check out the [docs](/docs/api/browser/action).
 *
 * <example>
    :action.js
    it('run multiple actions at once for a pinch zoom', async () => {
        await browser.actions([
            browser.action('pointer')
                .move(500, 500)
                .down()
                .move(250, 250)
                .up(),
            browser.action('pointer')
                .move(500, 500)
                .down()
                .move(750, 750)
                .up()
        ])
    });
 * </example>
 *
 * @alias browser.action
 * @type utility
 *
 */
export async function actions (
    this: WebdriverIO.Browser,
    actions: (KeyAction | PointerAction | WheelAction)[],
): Promise<void> {
    await this.performActions(actions.map((action) => action.toJSON()))
    await this.releaseActions()
}
