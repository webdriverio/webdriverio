import { getElementRect } from '../../utils'

/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    it('should demonstrate the getLocation function', () => {
        browser.url('http://github.com');
        const logo = $('.octicon-mark-github')
        const location = logo.getLocation();
        console.log(location); // outputs: { x: 150, y: 20 }

        const xLocation = logo.getLocation('x')
        console.log(xLocation); // outputs: 150

        const yLocation = logo.getLocation('.octicon-mark-github', 'y')
        console.log(yLocation); // outputs: 20
    });
 * </example>
 *
 * @alias element.getLocation
 * @param {String} prop    can be "x" or "y" to get a result value directly for easier assertions
 * @return {Object|Number}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 * @uses protocol/elementIdLocation
 * @type property
 */
export default async function getLocation (
    this: WebdriverIO.Element,
    prop?: 'x' | 'y'
) {
    let location: {
        x?: number,
        y?: number,
        width?: number
        height?: number
    } = {}

    if (this.isW3C) {
        location = await getElementRect(this)
        delete location.width
        delete location.height
    } else {
        location = await this.getElementLocation(this.elementId)
    }

    if (prop === 'x' || prop === 'y') {
        return location[prop] as number
    }

    return location as {
        x: number
        y: number
    }
}
