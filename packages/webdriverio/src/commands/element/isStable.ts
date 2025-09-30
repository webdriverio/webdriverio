import { ELEMENT_KEY } from 'webdriver'

import { getBrowserObject } from '@wdio/utils'
import isElementStable from '../../scripts/isElementStable.js'

/**
 *
 * Will return true when the element is stable (not animating) or false when unstable (currently animating).
 * We generally recommend disabling animations in your test environment instead of using this command,
 * but this method is provided for cases where that's not feasible.
 *
 * __Note:__ This command is only available for desktop and mobile browsers, not for native mobile apps.
 *
 * __Background/Inactive Tab Issue:__ This command will fail with an error if the browser tab is inactive
 * (minimized, in background, or hidden) because animations don't run in inactive tabs due to browser
 * performance optimizations. To work around this issue, you can add Chrome options to prevent background
 * throttling:
 *
 * ```js
 * // In your wdio.conf.js
 * capabilities: [{
 *     browserName: 'chrome',
 *     'goog:chromeOptions': {
 *         args: [
 *             '--disable-backgrounding-occluded-windows',
 *             '--disable-renderer-backgrounding'
 *         ]
 *     }
 * }]
 * ```
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

    :isStable.js
    it('should detect if an element is stable', async () => {
        let element = await $('#has-animation');
        console.log(await element.isStable()); // outputs: false

        element = await $('#has-no-animation')
        console.log(await element.isStable()); // outputs: true
    });
 * </example>
 *
 * @alias element.isStable
 * @return {Boolean} true if element is stable, false if unstable
 * @type state
 *
 */
export async function isStable (this: WebdriverIO.Element) {
    const browser = getBrowserObject(this)

    if (browser.isMobile && browser.isNativeContext) {
        throw new Error('The `isStable` command is only available for desktop and mobile browsers.')
    }

    return await browser.executeAsync(isElementStable, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as unknown as HTMLElement)
}
