import { getBrowserObject } from '@wdio/utils'
import type { TapOptions } from '../../types.js'

/**
 *
 * Performs a tap gesture on the given element on the screen.
 *
 * <example>
    :tap.offset.js
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
    :tap.example.js
    it('should be able to open the contacts menu on iOS by executing a longPress of 5 seconds', async () => {
        const contacts = $('~Contacts')
        // opens the Contacts menu on iOS where you can quickly create
        // a new contact, edit your home screen, or remove the app
        await contacts.longPress({ duration: 5 * 1000 })
    })
 * </example>
 *
 * @param {TapOptions=} options     Long press options (optional)
 * @param {number=}     options.x   Number (optional, mandatory if y is set)
 * @param {number=}     options.y   Number (optional, mandatory if x is set)
 */
export function tap(
    this: WebdriverIO.Element,
    options?: TapOptions
) {
    const browser = getBrowserObject(this)

    if (!browser.isMobile) {
        throw new Error('The tap command is only available for mobile platforms.')
    }

    if (
        typeof options !== 'undefined' &&
        (typeof options !== 'object' || Array.isArray(options))
    ) {
        throw new TypeError('Options must be an object.')
    }

    if (
        typeof options !== 'undefined' &&
        (options.x === undefined || options.y === undefined)
    ) {
        throw new TypeError(`If ${options.x !== undefined ? 'x' : 'y'} is set, then ${options.x !== undefined ? 'y' : 'x'} must be set as well.`)
    }

}
