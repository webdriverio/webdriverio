/**
 *
 * Scroll element into viewport.
 *
 * <example>
    :scrollIntoView.js
    it('should demonstrate the scrollIntoView command', function () {
        const elem = $('#myElement');
        // scroll to specific element
        elem.scrollIntoView();
    });
 * </example>
 *
 * @alias browser.scrollIntoView
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scrollIntoView () {
    return this.parent.execute((elem) => elem.scrollIntoView(), {
        ELEMENT: this.elementId
    })
}
