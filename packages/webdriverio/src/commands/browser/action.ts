import { KeyAction, PointerAction, WheelAction, ActionType, BaseActionParams } from '../../utils/actions/index.js'

/**
 * The action command is a low-level interface for providing virtualized device input actions to the web browser.
 *
 * In addition to high level commands such like `scrollIntoView`, `doubleClick`, the Actions API provides granular
 * control over exactly what designated input devices can do. WebdriverIO provides an interface for 3 kinds of input
 * sources:
 *
 * - a key input for keyboard devices
 * - a pointer input for a mouse, pen or touch devices
 * - and wheel inputs for scroll wheel devices
 *
 * <example>
    :action.js
    it('drag and drop using action command', async () => {
        const origin = await $('#source')
        const targetOrigin = await $('#target')

        return browser.action('pointer')
            .move({ duration: 0, origin, x: 0, y: 0 })
            .down({ button: 0 }) // left button
            .pause(10)
            .move({ duration, origin: targetOrigin })
            .up({ button: 0 })
            .perform()
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
