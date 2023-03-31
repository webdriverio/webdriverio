import type { ActionType, BaseActionParams } from '../../utils/actions/index.js'
import { KeyAction, PointerAction, WheelAction } from '../../utils/actions/index.js'

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
 * Every chain of action commands has to be completed calling `perform` in order to trigger the set of actions. This
 * causes actions [to be released](https://w3c.github.io/webdriver/#release-actions) and events to be fired. You can
 * skip this by passing in `true` (e.g. `browser.actions(...).perform(true)`).
 *
 * :::info
 *
 * Support for this command and specific actions can differ based on the environment. Progress on the development
 * can be followed on [wpt.fyi](https://wpt.fyi/results/webdriver/tests/perform_actions?label=experimental&label=master&aligned).
 * For mobile you might want to use Appium specific gesture commands on [iOS](https://github.com/appium/appium-xcuitest-driver#mobile-pinch)
 * and [Android](https://github.com/appium/appium-uiautomator2-driver#mobile-gesture-commands).
 *
 * :::
 *
 * ### Key input source
 *
 * A key input source is an input source that is associated with a keyboard-type device. It can be triggered
 * by using the `key` type parameters. e.g.:
 *
 * ```ts
 * browser.action('key')
 * ```
 *
 * It returns a `KeyAction` object that supports the following actions:
 *
 * - `down(value: string)`: generates a key down action
 * - `up(value: string)`: generates a key up action
 * - `pause(ms: number)`: indicate that an input source does nothing during a particular tick
 *
 * #### Special Characters
 *
 * If you like to use special characters like e.g. `Control`, `Page Up` or `Shift`, make sure to import the
 * [`Key`](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/constants.ts#L352-L417) object
 * from the `webdriverio` package like so:
 *
 * ```ts
 * import { Key } from 'webdriverio'
 * ```
 *
 * The object allows you to access the unicode representation of the desired special character.
 *
 * ### Pointer input source
 *
 * A pointer input source is an input source that is associated with a pointer-type input device. The type can be
 * specified when invoking the `action` command, e.g.:
 *
 * ```ts
 * browser.action('pointer', {
 *     parameters: { pointerType: 'mouse' } // "mouse" is default value, also possible: "pen" or "touch"
 * })
 * ```
 *
 * It returns a `PointerAction` object that supports the following actions:
 *
 * - `down (button: 'left' | 'middle' | 'right')`: creates an action to press a single key
 * - `down (params: PointerActionParams)`: creates an action to press a single key with detailed parameters
 * - `move (x: number, y: number)`: Creates an action for moving the pointer `x` and `y` pixels from the viewport
 * - `move (params: PointerActionMoveParams)`: Creates an action for moving the pointer `x` and `y` pixels from the
 *   specified `origin`. The `origin` may be defined as the pointers current position (e.g. "pointer"), the viewport
 *   (e.g. "viewport") or the center of a specific element.
 * - `up (button: 'left' | 'middle' | 'right')`: creates an action to release a single key
 * - `up (params: PointerActionUpParams)`: creates an action to release a single key with detailed parameters
 * - `cancel()`: An action that cancels this pointer's current input.
 * - `pause(ms: number)`: indicate that an input source does nothing during a particular tick
 *
 * You can find detailed information on the [`PointerActionParams`](https://github.com/webdriverio/webdriverio/blob/8ca026c75bf7c27ef9d574f0ec48d8bc13658602/packages/webdriverio/src/utils/actions/pointer.ts#L20-L35), [`PointerActionMoveParams`](https://github.com/webdriverio/webdriverio/blob/8ca026c75bf7c27ef9d574f0ec48d8bc13658602/packages/webdriverio/src/utils/actions/pointer.ts#L20-L42) and [`PointerActionUpParams`](https://github.com/webdriverio/webdriverio/blob/8ca026c75bf7c27ef9d574f0ec48d8bc13658602/packages/webdriverio/src/utils/actions/pointer.ts#L13-L19)
 * parameter types in the project type definition.
 *
 * ### Wheel input source
 *
 * A wheel input source is an input source that is associated with a wheel-type input device.
 *
 * ```ts
 * browser.action('wheel')
 * ```
 *
 * It returns a `WheelAction` object that supports the following actions:
 *
 * - `scroll (params: ScrollParams)`: scrolls a page to given coordinates or origin
 * - `pause(ms: number)`: indicate that an input source does nothing during a particular tick
 *
 * You can find detailed information on the [`ScrollParams`](https://github.com/webdriverio/webdriverio/blob/8ca026c75bf7c27ef9d574f0ec48d8bc13658602/packages/webdriverio/src/utils/actions/wheel.ts#L4-L29) parameter type in the project type definition.
 *
 * <example>
    :pointer-action.js
    it('drag and drop using pointer action command', async () => {
        const origin = await $('#source')
        const targetOrigin = await $('#target')

        return browser.action('pointer')
            .move({ duration: 0, origin, x: 0, y: 0 })
            .down({ button: 0 }) // left button
            .pause(10)
            .move({ duration: 0, origin: targetOrigin })
            .up({ button: 0 })
            .perform()
    });
    :key-action.js
    import { Key } from 'webdriverio'

    it('should emit key events using key action commands', async () => {
        const elem = await $('input')
        await elem.click() // make element active

        await browser.action('key)
            .down('f')
            .down('o')
            .down('o')
            .up('f')
            .up('o')
            .up('o')
            .perform()

        console.log(await elem.getValue()) // returns "foo"

        // copy value out of input element
        await browser.action('key')
            .down(Key.Ctrl).down('c')
            .pause(10)
            .up(Key.Ctrl).up('c')
            .perform()
    })
    :wheel-action.js
    it('should scroll using wheel action commands', async () => {
        console.log(await browser.execute(() => window.scrollY)) // returns 0
        await browser.action('wheel').scroll({
            deltaX: 0,
            deltaY: 500,
            duration: 200
        }).perform()
        console.log(await browser.execute(() => window.scrollY)) // returns 500
    })
 * </example>
 *
 * @alias browser.action
 * @type utility
 *
 */
export function action (
    this: WebdriverIO.Browser,
    type: 'key',
    opts?: Pick<BaseActionParams, 'id'>
): KeyAction
export function action (
    this: WebdriverIO.Browser,
    type: 'pointer',
    opts?: BaseActionParams
): PointerAction
export function action (
    this: WebdriverIO.Browser,
    type: 'wheel',
    opts?: Pick<BaseActionParams, 'id'>
): WheelAction
export function action (
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
