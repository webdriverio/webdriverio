import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import isElementStable from '../../scripts/isElementStable.js'

/**
 *
 * Will return true when stable (in animation) or when unstable (not in animation)
 *
 * <example>
    :index.html
    <head>
        <style>
            #has-animation {
                width: 200px;
                height: 200px;
                background-color: red;
                animation: 3s 0s alternate slidein;
            }
            @keyframes slidein {
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
    return await browser.executeAsync(isElementStable, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement)
}
