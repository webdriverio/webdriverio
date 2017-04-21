/**
 *
 * Get a css property from a DOM-element selected by given selector. The return value
 * is formatted to be testable. Colors gets parsed via [rgb2hex](https://www.npmjs.org/package/rgb2hex)
 * and all other properties get parsed via [css-value](https://www.npmjs.org/package/css-value).
 *
 * Note that shorthand CSS properties (e.g. background, font, border, margin, padding, list-style, outline,
 * pause, cue) are not returned, in accordance with the DOM CSS2 specification - you should directly access
 * the longhand properties (e.g. background-color) to access the desired values.
 *
 * <example>
    :example.html
    <label id="myLabel" for="input" style="color: #0088cc; font-family: helvetica, arial, freesans, clean, sans-serif, width: 100px">Some Label</label>

    :getCssProperty.js
    it('should demonstrate the getCssProperty command', function () {
        var elem = $('#myLabel')

        var color = elem.getCssProperty('color')
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

        var font = elem.getCssProperty('font-family')
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

        var width = elem.getCssProperty('width')
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
 * @alias browser.getCssProperty
 * @param {String} selector    element with requested style attribute
 * @param {String} cssProperty css property name
 * @uses protocol/elements, protocol/elementIdCssProperty
 * @type property
 *
 */

import parseCSS from '../helpers/parseCSS.js'
import { CommandError } from '../utils/ErrorHandler'

let getCssProperty = function (selector, cssProperty) {
    /*!
     * parameter check
     */
    if (typeof cssProperty !== 'string') {
        throw new CommandError('number or type of arguments don\'t agree with getCssProperty command')
    }

    return this.elements(selector).then((res) => {
        if (!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdCssPropertyCommands = []
        for (let elem of res.value) {
            elementIdCssPropertyCommands.push(this.elementIdCssProperty(elem.ELEMENT, cssProperty))
        }

        return Promise.all(elementIdCssPropertyCommands)
    }).then((result) => {
        /**
         * result already unwrapped when command was reran
         */
        if (!Array.isArray(result)) {
            return result
        }

        return parseCSS(result, cssProperty)
    })
}

export default getCssProperty
