import { KeyAction, PointerAction, WheelAction } from '../../utils/actions/index.js'

/**
 * This should document the action command
 *
 * <example>
    :action.js
    it('does some action', async () => {

    });
 * </example>
 *
 * @alias browser.action
 * @type utility
 *
 */
export default async function actions (
    this: WebdriverIO.Browser,
    actions: (KeyAction | PointerAction | WheelAction)[],
): Promise<void> {
    await this.performActions(actions.map((action) => action.toJSON()))
    await this.releaseActions()
}
