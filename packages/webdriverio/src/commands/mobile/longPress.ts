import { getBrowserObject } from '@wdio/utils'
import type { LongPressOptions } from '../../types.js'

/**
 *
 * Performs a long press gesture on the given element on the screen.
 *
 * This issues a WebDriver `action` command for the selected element. It is based on the `click` command.
 *
 * :::info
 *
 * This command only works with the following up-to-date components:
 *  - Appium server (version 2.0.0 or higher)
 *  - `appium-uiautomator2-driver` (for Android)
 *  - `appium-xcuitest-driver` (for iOS)
 *
 * Make sure your local or cloud-based Appium environment is regularly updated to avoid compatibility issues.
 *
 * :::
 *
 * <example>
    :longpress.offset.js
    it('should demonstrate a longPress using an offset on the iOS Contacts icon', async () => {
        const contacts = $('~Contacts')
        // opens the Contacts menu on iOS where you can quickly create
        // a new contact, edit your home screen, or remove the app
        // clicks 30 horizontal and 10 vertical pixels away from location of the icon (from center point of element)
        await contacts.longPress({ x: 30, y: 10 })
    })
 * </example>
 *
 * <example>
    :longpress.example.js
    it('should be able to open the contacts menu on iOS by executing a longPress of 5 seconds', async () => {
        const contacts = $('~Contacts')
        // opens the Contacts menu on iOS where you can quickly create
        // a new contact, edit your home screen, or remove the app
        await contacts.longPress({ duration: 5 * 1000 })
    })
 * </example>
 *
 * @alias element.click
 * @uses protocol/element, protocol/elementIdClick, protocol/performActions, protocol/positionClick
 * @type action
 * @param {LongPressOptions=} options           Long press options (optional)
 * @param {number=}           options.x         Number (optional)
 * @param {number=}           options.y         Number (optional)
 * @param {number=}           options.duration  Duration of the press in ms, default is 1500 ms <br /><strong>MOBILE-ONLY</strong>
 * @mobileElement
 */
export function longPress(
    this: WebdriverIO.Element,
    options?: Partial<LongPressOptions>
) {
    const browser = getBrowserObject(this)

    if (!browser.isMobile) {
        throw new Error('The longPress command is only available for mobile platforms.')
    }

    if (
        typeof options !== 'undefined' &&
        (typeof options !== 'object' || Array.isArray(options))
    ) {
        throw new TypeError('Options must be an object')
    }

    const defaultOptions: LongPressOptions = {
        duration: 1500,
        x: 0,
        y: 0,
    }

    const { duration, x, y }: LongPressOptions = { ...defaultOptions, ...options }

    return this.click({ duration, x, y })
}
