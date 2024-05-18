import type { RectReturn } from '@wdio/protocols'
import { getElementRect } from '../../utils/index.js'

export type Location = Pick<RectReturn, 'x' | 'y'>;

export function getLocation (this: WebdriverIO.Element): Promise<Location>
export function getLocation (this: WebdriverIO.Element, prop: keyof Location): Promise<number>
export function getLocation (this: WebdriverIO.Element, prop?: keyof Location): Promise<Location & number>

/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    it('should demonstrate the getLocation function', async () => {
        await browser.url('http://github.com');
        const logo = await $('.octicon-mark-github')
        const location = await logo.getLocation();
        console.log(location); // outputs: { x: 150, y: 20 }

        const xLocation = await logo.getLocation('x')
        console.log(xLocation); // outputs: 150

        const yLocation = await logo.getLocation('y')
        console.log(yLocation); // outputs: 20
    });
 * </example>
 *
 * @alias element.getLocation
 * @param {string} prop    can be "x" or "y" to get a result value directly for easier assertions
 * @return {Object|Number}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 * @uses protocol/elementIdLocation
 * @type property
 */
export async function getLocation (
    this: WebdriverIO.Element,
    prop?: keyof Location
): Promise<Location | number> {
    let location: Partial<RectReturn> = {}

    location = await getElementRect(this)
    delete location.width
    delete location.height

    if (prop === 'x' || prop === 'y') {
        return location[prop] as number
    }

    return location as Location
}
