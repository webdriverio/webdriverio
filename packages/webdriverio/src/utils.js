import fs from 'fs'
import path from 'path'
import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import GraphemeSplitter from 'grapheme-splitter'
import logger from '@wdio/logger'
import isObject from 'lodash.isobject'
import { URL } from 'url'

import { ELEMENT_KEY, UNICODE_CHARACTERS } from './constants'
import { findStrategy } from './utils/findStrategy'

const log = logger('webdriverio')
const INVALID_SELECTOR_ERROR = 'selector needs to be typeof `string` or `function`'

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
 * get element id from WebDriver response
 * @param  {?Object|undefined} res         body object from response or null
 * @return {?string}   element id or null if element couldn't be found
 */
export const getElementFromResponse = (res) => {
    /**
    * a function selector can return null
    */
    if (!res) {
        return null
    }

    /**
     * deprecated JSONWireProtocol response
     */
    if (res.ELEMENT) {
        return res.ELEMENT
    }

    /**
     * W3C WebDriver response
     */
    if (res[ELEMENT_KEY]) {
        return res[ELEMENT_KEY]
    }

    return null
}

/**
 * traverse up the scope chain until browser element was reached
 */
export function getBrowserObject (elem) {
    return elem.parent ? getBrowserObject(elem.parent) : elem
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
    return Object.prototype.hasOwnProperty.call(UNICODE_CHARACTERS, value)
        ? [UNICODE_CHARACTERS[value]]
        : new GraphemeSplitter().splitGraphemes(value)
}

function fetchElementByJSFunction (selector, scope) {
    if (!scope.elementId) {
        return scope.execute(selector)
    }
    /**
     * use a regular function because IE does not understand arrow functions
     */
    const script = (function (elem) { return (selector).call(elem) }).toString().replace('selector', `(${selector.toString()})`)
    return getBrowserObject(scope).execute(`return (${script}).apply(null, arguments)`, scope)
}

/**
 * logic to find an element
 */
export async function findElement(selector) {
    /**
     * fetch element using regular protocol command
     */
    if (typeof selector === 'string') {
        const { using, value } = findStrategy(selector, this.isW3C, this.isMobile)
        return this.elementId
            ? this.findElementFromElement(this.elementId, using, value)
            : this.findElement(using, value)
    }

    /**
     * fetch element with JS function
     */
    if (typeof selector === 'function') {
        const notFoundError = new Error(`Function selector "${selector.toString()}" did not return an HTMLElement`)
        let elem = await fetchElementByJSFunction(selector, this)
        elem = Array.isArray(elem) ? elem[0] : elem
        return getElementFromResponse(elem) ? elem : notFoundError
    }

    throw new Error(INVALID_SELECTOR_ERROR)
}

/**
 * logic to find a elements
 */
export async function findElements(selector) {
    /**
     * fetch element using regular protocol command
     */
    if (typeof selector === 'string') {
        const { using, value } = findStrategy(selector, this.isW3C, this.isMobile)
        return this.elementId
            ? this.findElementsFromElement(this.elementId, using, value)
            : this.findElements(using, value)
    }

    /**
     * fetch element with JS function
     */
    if (typeof selector === 'function') {
        let elems = await fetchElementByJSFunction(selector, this)
        elems = Array.isArray(elems) ? elems : [elems]
        return elems.filter((elem) => elem && getElementFromResponse(elem))
    }

    throw new Error(INVALID_SELECTOR_ERROR)
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

/**
 * getElementRect
 */
export async function getElementRect(scope) {
    const rect = await scope.getElementRect(scope.elementId)

    let defaults = { x: 0, y: 0, width: 0, height: 0 }

    /**
     * getElementRect workaround for Safari 12.0.3
     * if one of [x, y, height, width] is undefined get rect with javascript
     */
    if (Object.keys(defaults).some(key => rect[key] == null)) {
        /* istanbul ignore next */
        const rectJs = await getBrowserObject(scope).execute(function (el) {
            if (!el || !el.getBoundingClientRect) {
                return
            }
            const { left, top, width, height } = el.getBoundingClientRect()
            return {
                x: left + this.scrollX,
                y: top + this.scrollY,
                width,
                height
            }
        }, scope)

        // try set proper value
        Object.keys(defaults).forEach(key => {
            if (rect[key] != null) {
                return
            }
            if (typeof rectJs[key] === 'number') {
                rect[key] = Math.floor(rectJs[key])
            } else {
                log.error('getElementRect', { rect, rectJs, key })
                throw new Error('Failed to receive element rects via execute command')
            }
        })
    }

    return rect
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

/**
 * check if urls are valid and fix them if necessary
 * @param  {string}  url                url to navigate to
 * @param  {Boolean} [retryCheck=false] true if an url was already check and still failed with fix applied
 * @return {string}                     fixed url
 */
export function validateUrl (url, origError) {
    try {
        const urlObject = new URL(url)
        return urlObject.href
    } catch (e) {
        /**
         * if even adding http:// doesn't help, fail with original error
         */
        if (origError) {
            throw origError
        }

        return validateUrl(`http://${url}`, e)
    }
}
