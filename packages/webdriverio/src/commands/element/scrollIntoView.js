/**
 *
 * Scroll element into viewport.
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
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scrollIntoView () {
    return this.parent.execute(/* istanbul ignore next */(elem) => elem.scrollIntoView(), {
        ELEMENT: this.elementId
    })
}
