/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    it('should get the location of one or multiple elements', function () {
        browser.url('http://github.com');
        var location = browser.getLocation('.octicon-mark-github');
        console.log(location); // outputs: { x: 150, y: 20 }
        var xLocation = browser.getLocation('.octicon-mark-github', 'x')
        console.log(xLocation); // outputs: 150
        var yLocation = browser.getLocation('.octicon-mark-github', 'y')
        console.log(yLocation); // outputs: 20
    });
 * </example>
 *
 * @alias browser.getLocation
 * @param {String} selector    element with requested position offset
 * @param {String} property    can be "x" or "y" to get a result value directly for easier assertions
 * @return {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 * @uses protocol/elementIdLocation
 * @type property
 */
export default async function getLocation (prop) {
    let location = {}

    if (this.isW3C) {
        location = await this.getElementRect(this.elementId)
        delete location.width
        delete location.height
    } else {
        location = await this.elementIdLocation(this.elementId)
    }

    if (prop === 'x' || prop === 'y') {
        return location[prop]
    }

    return location
}
