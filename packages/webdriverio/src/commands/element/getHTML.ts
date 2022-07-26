import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import getHTMLScript from '../../scripts/getHTML.js'

/**
 *
 * Get source code of specified DOM element by selector.
 *
 * <example>
    :index.html
    <div id="test">
        <span>Lorem ipsum dolor amet</span>
    </div>
    :getHTML.js
    it('should get html for certain elements', async () => {
        var outerHTML = await $('#test').getHTML();
        console.log(outerHTML);
        // outputs:
        // "<div id="test"><span>Lorem ipsum dolor amet</span></div>"

        var innerHTML = await $('#test').getHTML(false);
        console.log(innerHTML);
        // outputs:
        // "<span>Lorem ipsum dolor amet</span>"
    });
 * </example>
 *
 * @alias element.getHTML
 * @param {Boolean=} includeSelectorTag if true it includes the selector element tag (default: true)
 * @return {String}  the HTML of the specified element
 * @uses action/selectorExecute
 * @type property
 *
 */
export default function getHTML (
    this: WebdriverIO.Element,
    includeSelectorTag = true
) {
    const browser = getBrowserObject(this)
    return browser.execute(getHTMLScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement, includeSelectorTag)
}
