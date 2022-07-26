import { KeyAction, PointerAction, WheelAction, ActionType, BaseActionParams } from '../../utils/actions/index.js'

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
export default function action (
    this: WebdriverIO.Browser,
    type: 'key',
    opts?: Pick<BaseActionParams, 'id'>
): KeyAction
export default function action (
    this: WebdriverIO.Browser,
    type: 'pointer',
    opts?: BaseActionParams
): PointerAction
export default function action (
    this: WebdriverIO.Browser,
    type: 'wheel',
    opts?: Pick<BaseActionParams, 'id'>
): WheelAction
export default function action (
    this: WebdriverIO.Browser,
    type: ActionType,
    opts?: BaseActionParams
): KeyAction | PointerAction | WheelAction {
    if (type === 'key') {
        return new KeyAction(this, opts)
    }
    if (type === 'pointer') {
        return new PointerAction(this, opts)
    }
    if (type === 'wheel') {
        return new WheelAction(this, opts)
    }

    throw new Error(`Unsupported action type "${type}", supported are "key", "pointer", "wheel"`)
}
