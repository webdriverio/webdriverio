import cssShorthandProps from 'css-shorthand-properties'
import { parseCSS } from '../../utils/index.js'

/**
 *
 * Get a css property from a DOM-element selected by given selector. The return value
 * is formatted to be testable. Colors gets parsed via [rgb2hex](https://www.npmjs.org/package/rgb2hex)
 * and all other properties get parsed via [css-value](https://www.npmjs.org/package/css-value).
 *
 * :::info
 *
 * Note that shorthand CSS properties (e.g. `background`, `font`, `border`, `margin`,
 * `padding`, `list-style`, `outline`, `pause`, `cue`) will be expanded to fetch all longhand
 * properties resulting in multiple WebDriver calls. If you are interested in a specific
 * longhand property it is recommended to query for that instead.
 *
 * :::
 *
 * <example>
    :example.html
    <label id="myLabel" for="input" style="color: #0088cc; font-family: helvetica, arial, freesans, clean, sans-serif, width: 100px">Some Label</label>
    :getCSSProperty.js
    it('should demonstrate the getCSSProperty command', async () => {
        const elem = await $('#myLabel')
        const color = await elem.getCSSProperty('color')
        console.log(color)
        // outputs the following:
        // {
        //     property: 'color',
        //     value: 'rgba(0, 136, 204, 1)',
        //     parsed: {
        //         hex: '#0088cc',
        //         alpha: 1,
        //         type: 'color',
        //         rgba: 'rgba(0, 136, 204, 1)'
        //     }
        // }

        const font = await elem.getCSSProperty('font-family')
        console.log(font)
        // outputs the following:
        // {
        //      property: 'font-family',
        //      value: 'helvetica',
        //      parsed: {
        //          value: [ 'helvetica', 'arial', 'freesans', 'clean', 'sans-serif' ],
        //          type: 'font',
        //          string: 'helvetica, arial, freesans, clean, sans-serif'
        //      }
        // }

        var width = await elem.getCSSProperty('width')
        console.log(width)
        // outputs the following:
        // {
        //     property: 'width',
        //     value: '100px',
        //     parsed: {
        //         type: 'number',
        //         string: '100px',
        //         unit: 'px',
        //         value: 100
        //     }
        // }
    })
 * </example>
 *
 * @alias element.getCSSProperty
 * @param  {String}      cssProperty css property name
 * @return {CSSProperty}             The specified css of the element
 *
 */
export async function getCSSProperty (
    this: WebdriverIO.Element,
    cssProperty: string
) {
    /**
     * Getting the css value of a shorthand property results in different results
     * given that the behavior of `getComputedStyle` is not defined in this case.
     * Therefore if we don't deal with a shorthand property run `getElementCSSValue`
     * otherwise expand it and run the command for each longhand property.
     */
    if (!cssShorthandProps.isShorthand(cssProperty)) {
        const cssValue = await this.getElementCSSValue(this.elementId, cssProperty)
        return parseCSS(cssValue, cssProperty)
    }

    const properties = cssShorthandProps.expand(cssProperty)
    let cssValues = await Promise.all(
        properties.map((prop) => this.getElementCSSValue(this.elementId, prop))
    )

    /**
     * merge equal symmetrical values
     * - e.g. `36px 10px 36px 10px` to `36px 10px`
     * - or `0px 0px 0px 0px` to `0px`
     */
    while ((cssValues.length % 2) === 0) {
        const mergedValues = [
            cssValues.slice(0, cssValues.length / 2).join(' '),
            cssValues.slice(cssValues.length / 2).join(' ')
        ]

        const hasEqualProperties = mergedValues.every((v) => v === mergedValues[0])
        if (!hasEqualProperties) {
            break
        }

        cssValues = cssValues.slice(0, cssValues.length / 2)
    }

    return parseCSS(cssValues.join(' '), cssProperty)
}
