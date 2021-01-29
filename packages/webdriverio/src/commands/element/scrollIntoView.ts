import { ELEMENT_KEY } from '../../constants'

/**
 *
 * Scroll element into viewport ([MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)).
 *
 * <example>
    :scrollIntoView.js
    it('should demonstrate the scrollIntoView command', () => {
        const elem = $('#myElement');
        // scroll to specific element
        elem.scrollIntoView();
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} scrollIntoViewOptions  options for `Element.scrollIntoView()` (default: `true`)
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scrollIntoView (
    this: WebdriverIO.Element,
    scrollIntoViewOptions = true
) {
    return this.parent.execute(/* istanbul ignore next */function (elem: HTMLElement, options: boolean) {
        elem.scrollIntoView(options)
    }, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement, scrollIntoViewOptions)
}
