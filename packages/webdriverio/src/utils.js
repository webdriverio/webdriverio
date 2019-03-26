import fs from 'fs'
import path from 'path'
import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import GraphemeSplitter from 'grapheme-splitter'
import isObject from 'lodash.isobject'

import { ELEMENT_KEY, UNICODE_CHARACTERS } from './constants'

const applyScopePrototype = (prototype, scope) => {
    const dir = path.resolve(__dirname, 'commands', scope)
    const files = fs.readdirSync(dir)
    for (let filename of files) {
        const commandName = path.basename(filename, path.extname(filename))
        prototype[commandName] = { value: require(path.join(dir, commandName)).default }
    }
}

/**
 * enhances objects with element commands
 */
export const getPrototype = (scope) => {
    const prototype = {}

    /**
     * register action commands
     */
    applyScopePrototype(prototype, scope)
    return prototype
}

/**
 * transform whatever value is into an array of char strings
 */
export function transformToCharString (value) {
    const ret = []

    if (!Array.isArray(value)) {
        value = [value]
    }

    for (const val of value) {
        if (typeof val === 'string') {
            ret.push(...checkUnicode(val))
        } else if (typeof val === 'number') {
            const entry = `${val}`.split('')
            ret.push(...entry)
        } else if (val && typeof val === 'object') {
            try {
                ret.push(...JSON.stringify(val).split(''))
            } catch (e) { /* ignore */ }
        } else if (typeof val === 'boolean') {
            const entry = val ? 'true'.split('') : 'false'.split('')
            ret.push(...entry)
        }
    }

    return ret
}

function sanitizeCSS (value) {
    /* istanbul ignore next */
    if (!value) {
        return value
    }

    return value.trim().replace(/'/g, '').replace(/"/g, '').toLowerCase()
}

/**
 * parse css values to a better format
 * @param  {Object} cssPropertyValue result of WebDriver call
 * @param  {String} cssProperty      name of css property to parse
 * @return {Object}                  parsed css property
 */
export function parseCSS (cssPropertyValue, cssProperty) {
    if (!cssPropertyValue) {
        return null
    }

    let parsedValue = {
        property: cssProperty,
        value: cssPropertyValue.toLowerCase().trim()
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
        let font = cssValue(cssPropertyValue)
        let string = parsedValue.value
        let value = cssPropertyValue.split(/,/).map(sanitizeCSS)

        parsedValue.value = sanitizeCSS(font[0].value || font[0].string)
        parsedValue.parsed = { value, type: 'font', string }
    } else {
        /**
         * parse other css properties
         */
        try {
            parsedValue.parsed = cssValue(cssPropertyValue)

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

/**
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
export function checkUnicode (value) {
    return UNICODE_CHARACTERS.hasOwnProperty(value) ? [UNICODE_CHARACTERS[value]] : new GraphemeSplitter().splitGraphemes(value)
}

/**
 * Strip element object and return w3c and jsonwp compatible keys
 */

export function verifyArgsAndStripIfElement(args) {
    function verify(arg) {
        if (isObject(arg) && arg.constructor.name === 'Element') {
            if (!arg.elementId) {
                throw new Error(`The element with selector "${arg.selector}" you trying to pass into the execute method wasn't found`)
            }

            return {
                [ELEMENT_KEY]: arg.elementId,
                ELEMENT: arg.elementId
            }
        }

        return arg
    }

    return !Array.isArray(args) ? verify(args) : args.map(verify)
}

export function getAbsoluteFilepath(filepath) {
    return filepath.startsWith('/') || filepath.startsWith('\\') || filepath.match(/^[a-zA-Z]:\\/)
        ? filepath
        : path.join(process.cwd(), filepath)
}

/**
 * check if directory exists
 */
export function assertDirectoryExists(filepath) {
    if (!fs.existsSync(path.dirname(filepath))) {
        throw new Error(`directory (${path.dirname(filepath)}) doesn't exist`)
    }
}
