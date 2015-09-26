import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'

import sanitize from './sanitize'

let parse = function (cssPropertyValue, cssProperty) {
    if (!cssPropertyValue || !cssPropertyValue.value) {
        return null
    }

    let parsedValue = {
        property: cssProperty,
        value: cssPropertyValue.value.toLowerCase().trim()
    }

    if (parsedValue.value.indexOf('rgb') === 0) {
        /**
         * remove whitespaces in rgb values
         */
        parsedValue.value = parsedValue.value.replace(/\s/g, '')

        /**
         * parse color values
         */
        let color = parsedValue.value
        parsedValue.parsed = rgb2hex(parsedValue.value)
        parsedValue.parsed.type = 'color'
        parsedValue.parsed[/[rgba]+/g.exec(color)[0]] = color
    } else if (parsedValue.property === 'font-family') {
        let font = cssValue(cssPropertyValue.value)
        let string = parsedValue.value
        let value = cssPropertyValue.value.split(/,/).map(sanitize.css)

        parsedValue.value = sanitize.css(font[0].value || font[0].string)
        parsedValue.parsed = { value, type: 'font', string }
    } else {
        /**
         * parse other css properties
         */
        try {
            parsedValue.parsed = cssValue(cssPropertyValue.value)

            if (parsedValue.parsed.length === 1) {
                parsedValue.parsed = parsedValue.parsed[0]
            }

            if (parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
                parsedValue.value = parsedValue.parsed.value
            }
        } catch (e) {
            // TODO improve css-parse lib to handle properties like
            // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
        }
    }

    return parsedValue
}

let parseCSS = function (response, cssProperty) {
    let parsedCSS = []

    for (let res of response) {
        parsedCSS.push(parse(res, cssProperty))
    }

    if (parsedCSS.length === 1) {
        return parsedCSS[0]
    } else if (parsedCSS.length === 0) {
        return null
    }

    return parsedCSS
}

export default parseCSS
