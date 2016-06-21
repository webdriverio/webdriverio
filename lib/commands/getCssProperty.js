/**
 *
 * Get a css property from a DOM-element selected by given selector. The return value
 * is formatted to be testable. Colors gets parsed via [rgb2hex](https://www.npmjs.org/package/rgb2hex)
 * and all other properties gets parsed via [css-value](https://www.npmjs.org/package/css-value).
 *
 * Note that shorthand CSS properties (e.g. background, font, border, margin, padding, list-style, outline,
 * pause, cue) are not returned, in accordance with the DOM CSS2 specification- you should directly access
 * the longhand properties (e.g. background-color) to access the desired values.
 *
 * <example>
    :getCssPropertyAsync.js
    client.getCssProperty('#someElement', 'color').then(function(color) {
        console.log(color);
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
    });

    client.getCssProperty('#someElement', 'width').then(function(width) {
        console.log(width);
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
    });

    client.getCssProperty('body', 'font-family').then(function(font) {
        console.log(font);
        // outputs the following:
        // {
        //      property: 'font-family',
        //      value: 'helvetica',
        //      parsed: {
        //          value: [ 'helvetica', 'arial', 'freesans', 'clean', 'sans-serif' ],
        //          type: 'font',
        //          string: 'helvetica, arial, freesans, clean, sans-serif'
        //      }
        //  }
    })

    :getCssPropertySync.js
    it('should demonstrate the getCssProperty command', function () {
        var elem = browser.element('#someElement');

        var color = elem.getCssProperty('color');
        console.log(color); // outputs: (see above)
    });
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
            throw new CommandError(7)
        }

        let elementIdCssPropertyCommands = []
        for (let elem of res.value) {
            elementIdCssPropertyCommands.push(this.elementIdCssProperty(elem.ELEMENT, cssProperty))
        }

        return Promise.all(elementIdCssPropertyCommands)
    }).then((result) => parseCSS(result, cssProperty))
}

export default getCssProperty
