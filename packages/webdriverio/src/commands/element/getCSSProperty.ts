import cssShorthandProps from 'css-shorthand-properties'
import { getBrowserObject } from '@wdio/utils'

import { parseCSS } from '../../utils/index.js'

type PseudoElement = '::before' | '::after'

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

        var width = await elem.getCSSProperty('width', '::before')
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
 * @alias element.getCSSProperty
 * @param  {string}        cssProperty   css property name
 * @param  {PseudoElement} pseudoElement css pseudo element
 * @return {CSSProperty}                 The specified css of the element
 *
 */
export async function getCSSProperty(
    this: WebdriverIO.Element,
    cssProperty: string,
    pseudoElement?: PseudoElement,
) {
    const getCSSProperty = cssShorthandProps.isShorthand(cssProperty)
        ? getShorthandPropertyCSSValue
        : getPropertyCSSValue

    const cssValue = await getCSSProperty.call(
        this,
        {
            cssProperty,
            pseudoElement,
        }
    )

    return parseCSS(cssValue, cssProperty)
}

type Options = {
    cssProperty: string;
    pseudoElement?: PseudoElement;
}

async function getShorthandPropertyCSSValue(
    this: WebdriverIO.Element,
    options: Options
) {
    const { pseudoElement, cssProperty } = options
    const properties = getShorthandProperties(cssProperty)

    if (pseudoElement) {
        const cssValues = await Promise.all(
            properties.map((prop) => getPseudoElementCSSValue(
                this,
                {
                    pseudoElement,
                    cssProperty: prop,
                }
            ))
        )
        return mergeEqualSymmetricalValue(cssValues)
    }

    const cssValues = await Promise.all(
        properties.map((prop) => this.getElementCSSValue(this.elementId, prop))
    )

    return mergeEqualSymmetricalValue(cssValues)
}

async function getPropertyCSSValue(
    this: WebdriverIO.Element,
    options: Options,
) {
    const { pseudoElement, cssProperty } = options

    if (pseudoElement) {
        return await getPseudoElementCSSValue(
            this,
            {
                pseudoElement,
                cssProperty
            }
        )
    }

    return await this.getElementCSSValue(this.elementId, cssProperty)
}

function getShorthandProperties(cssProperty: string) {
    /**
     * Getting the css value of a shorthand property results in different results
     * given that the behavior of `getComputedStyle` is not defined in this case.
     * Therefore if we don't deal with a shorthand property run `getElementCSSValue`
     * otherwise expand it and run the command for each longhand property.
     */
    return cssShorthandProps.expand(cssProperty)
}

function mergeEqualSymmetricalValue(cssValues: string[]) {
    /**
     * merge equal symmetrical values
     * - e.g. `36px 10px 36px 10px` to `36px 10px`
     * - or `0px 0px 0px 0px` to `0px`
    */
    let newCssValues = [...cssValues]
    while ((newCssValues.length % 2) === 0) {
        const mergedValues = [
            newCssValues.slice(0, newCssValues.length / 2).join(' '),
            newCssValues.slice(newCssValues.length / 2).join(' ')
        ]

        const hasEqualProperties = mergedValues.every((v) => v === mergedValues[0])
        if (!hasEqualProperties) {
            break
        }

        newCssValues = newCssValues.slice(0, newCssValues.length / 2)
    }

    return newCssValues.join(' ')
}

async function getPseudoElementCSSValue(
    elem: WebdriverIO.Element,
    options: Required<Options>
): Promise<string> {
    const browser = getBrowserObject(elem)
    const { cssProperty, pseudoElement } = options
    const cssValue = await browser.execute(
        (elem: Element, pseudoElement: string, cssProperty: string) => {
            // Check if element is still connected to the DOM
            // This helps detect stale elements in BiDi mode
            if (typeof elem.isConnected === 'boolean' && !elem.isConnected) {
                throw new Error('stale element reference: element is not attached to the page document')
            }
            return (window.getComputedStyle(elem, pseudoElement))[cssProperty as unknown as number]
        },
        elem as unknown as Element,
        pseudoElement,
        cssProperty
    )

    return cssValue
}
