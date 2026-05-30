import { getBrowserObject } from '@wdio/utils'
import type { WaitForOptions } from '../../types.js'

/**
 *
 * Wait for an element for the provided amount of
 * milliseconds to be stable (not animating). Returns true if the selector
 * matches at least one element that is stable in the DOM, otherwise throws an
 * error. If the reverse flag is true, the command will instead return true
 * if the selector does not match any stable elements.
 *
 * __Note 1:__ it's best to disable animations instead of using this command
 *
 * __Note 2:__ this command is only available for desktop and mobile browsers, not for native mobile apps.
 *
 * <example>
    :index.html
    <head>
        <style>
            div {
                width: 200px;
                height: 200px;
                background-color: red;
            }
            #has-animation {
                animation: 3s 0s alternate slidein;
            }
            \@keyframes slidein {
                from {
                    margin-left: 100%;
                    width: 300%;
                }

                to {
                    margin-left: 0%;
                    width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div #has-animation></div>
        <div #has-no-animation></div>
    </body>

    :waitForStable.js
    it('should detect that element is instable and will wait for the element to become stable', async () => {
        const elem = await $('#has-animation')
        await elem.waitForStable({ timeout: 3000 });
    });
    it('should detect that element is stable and will not wait', async () => {
        const elem = await $('#has-no-animation')
        await elem.waitForStable();
    });
 * </example>
 *
 * @alias element.waitForStable
 * @param {WaitForOptions=}  options             waitForStable options (optional)
 * @param {Number=}          options.timeout     time in ms (default set based on [`waitforTimeout`](/docs/configuration#waitfortimeout) config value)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} true if element is stable
 * @uses utility/waitUntil, state/isStable
 * @type utility
 *
 */
export async function waitForStable (
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}stable after ${timeout}ms`
    }: WaitForOptions = {}
) {
    let errorMsg!: string
    const browser = getBrowserObject(this)

    if (browser.isMobile && browser.isNativeContext) {
        throw new Error('The `waitForStable` command is only available for desktop and mobile browsers.')
    }

    await this.waitUntil(
        async () => {
            try {
                return reverse !== await this.isStable()
            } catch (error) {
                if (error instanceof Error) {
                    errorMsg = error.message
                } else if (typeof error === 'string') {
                    errorMsg = error
                } else {
                    errorMsg = 'The waitForStable command got an unknown error'
                }
                // fail early
                return !reverse
            }
        },
        { timeout, interval, timeoutMsg }
    )

    if (errorMsg) {
        throw Error(errorMsg)
    }
}
