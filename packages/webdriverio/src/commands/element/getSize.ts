import type { RectReturn } from '@wdio/protocols'

import { getElementRect } from '../../utils'

export type Size = Pick<RectReturn, 'width' | 'height'>;

function getSize (this: WebdriverIO.Element): Promise<Size>;

function getSize (this: WebdriverIO.Element, prop: keyof RectReturn): Promise<number>;

/**
 *
 * Get the width and height for an DOM-element.
 *
 * <example>
    :getSize.js
    it('should demonstrate the getSize command', () => {
        browser.url('http://github.com')
        const logo = $('.octicon-mark-github')

        const size = logo.getSize()
        console.log(size) // outputs: { width: 32, height: 32 }

        const width = logo.getSize('width')
        console.log(width) // outputs: 32

        const height = logo.getSize('height')
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
async function getSize (
    this: WebdriverIO.Element,
    prop?: keyof RectReturn
): Promise<Size | number> {
    let rect: Partial<RectReturn> = {}

    if (this.isW3C) {
        rect = await getElementRect(this)
    } else {
        rect = await this.getElementSize(this.elementId) as RectReturn
    }

    if (prop && rect[prop]) {
        return rect[prop] as number
    }

    return {
        width: rect.width,
        height: rect.height
    } as Size
}

export default getSize
