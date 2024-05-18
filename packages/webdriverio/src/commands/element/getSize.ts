import type { RectReturn } from '@wdio/protocols'

import { getElementRect } from '../../utils/index.js'

export type Size = Pick<RectReturn, 'width' | 'height'>;

export function getSize (this: WebdriverIO.Element): Promise<Size>;
export function getSize (this: WebdriverIO.Element, prop: keyof RectReturn): Promise<number>;
export function getSize (this: WebdriverIO.Element, prop?: keyof RectReturn): Promise<Size & number>;

/**
 *
 * Get the width and height for an DOM-element.
 *
 * <example>
    :getSize.js
    it('should demonstrate the getSize command', async () => {
        await browser.url('http://github.com')
        const logo = await $('.octicon-mark-github')

        const size = await logo.getSize()
        console.log(size) // outputs: { width: 32, height: 32 }

        const width = await logo.getSize('width')
        console.log(width) // outputs: 32

        const height = await logo.getSize('height')
        console.log(height) // outputs: 32
    })
 * </example>
 *
 * @alias element.getElementSize
 * @param {String=} prop     size to receive [optional] ("width" or "height")
 * @return {Object|Number}    requested element size (`{ width: <Number>, height: <Number> }`) or actual width/height as number if prop param is given
 * @type property
 *
 */
export async function getSize (
    this: WebdriverIO.Element,
    prop?: keyof RectReturn
): Promise<Size | number> {
    const rect = await getElementRect(this)

    if (prop && typeof rect[prop] === 'number') {
        return rect[prop] as number
    }

    return {
        width: rect.width,
        height: rect.height
    } as Size
}
