import fs from 'fs'
import path from 'path'
import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import GraphemeSplitter from 'grapheme-splitter'

import { ELEMENT_KEY, W3C_SELECTOR_STRATEGIES, UNICODE_CHARACTERS } from './constants'

const DEFAULT_SELECTOR = 'css selector'
const DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-ios uiautomation|accessibility id):(.+)/
const INVALID_SELECTOR_ERROR = new Error('selector needs to be typeof `string` or `function`')

export const findStrategy = function (value, isW3C, isMobile) {
    /**
     * set default selector
     */
    let using = DEFAULT_SELECTOR

    /**
     * check if user has specified locator strategy directly
     */
    const match = value.match(DIRECT_SELECTOR_REGEXP)
    if (match) {
        /**
         * ensure selector strategy is supported
         */
        if (!isMobile && isW3C && !W3C_SELECTOR_STRATEGIES.includes(match[1])) {
            throw new Error('InvalidSelectorStrategy') // ToDo: move error to wdio-error package
        }

        return {
            using: match[1],
            value: match[2]
        }
    }

    // use xPath strategy if value starts with //
    if (value.indexOf('/') === 0 || value.indexOf('(') === 0 ||
               value.indexOf('../') === 0 || value.indexOf('./') === 0 ||
               value.indexOf('*/') === 0) {
        using = 'xpath'

    // use link text strategy if value starts with =
    } else if (value.indexOf('=') === 0) {
        using = 'link text'
        value = value.slice(1)

    // use partial link text strategy if value starts with *=
    } else if (value.indexOf('*=') === 0) {
        using = 'partial link text'
        value = value.slice(2)

    // recursive element search using the UiAutomator library (Android only)
    } else if (value.indexOf('android=') === 0) {
        using = '-android uiautomator'
        value = value.slice(8)

    // recursive element search using the UIAutomation library (iOS-only)
    } else if (value.indexOf('ios=') === 0) {
        using = '-ios uiautomation'
        value = value.slice(4)

    // recursive element search using accessibility id
    } else if (value.indexOf('~') === 0) {
        using = 'accessibility id'
        value = value.slice(1)

    // class name mobile selector
    // for iOS = UIA...
    // for Android = android.widget
    } else if (value.slice(0, 3) === 'UIA' || value.slice(0, 15) === 'XCUIElementType' || value.slice(0, 14).toLowerCase() === 'android.widget') {
        using = 'class name'

    // use tag name strategy if value contains a tag
    // e.g. "<div>" or "<div />"
    } else if (value.search(/<[a-zA-Z-]+( \/)*>/g) >= 0) {
        using = 'tag name'
        value = value.replace(/<|>|\/|\s/g, '')

    // use name strategy if value queries elements with name attributes for JSONWP
    // e.g. "[name='myName']" or '[name="myName"]'
    } else if (!isW3C && value.search(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/) >= 0) {
        using = 'name'
        value = value.match(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/)[2]

    // allow to move up to the parent or select current element
    } else if (value === '..' || value === '.') {
        using = 'xpath'

    // any element with given class, id, or attribute and content
    // e.g. h1.header=Welcome or [data-name=table-row]=Item or #content*=Intro
    } else {
        const match = value.match(new RegExp([
            // HTML tag
            /^([a-z0-9|-]*)/,
            // optional . or # + class or id
            /(?:(\.|#)(-?[_a-zA-Z]+[_a-zA-Z0-9-]*))?/,
            // optional [attribute-name="attribute-value"]
            /(?:\[(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?:=(?:"|')([a-zA-z0-9\-_. ]+)(?:"|'))?\])?/,
            // *=query or =query
            /(\*)?=(.+)$/,
        ].map(rx => rx.source).join('')))

        if (match) {
            const PREFIX_NAME = { '.': 'class', '#': 'id' }
            const conditions = []
            const [
                tag,
                prefix, name,
                attrName, attrValue,
                partial, query
            ] =  match.slice(1)

            if (prefix) {
                conditions.push(`contains(@${PREFIX_NAME[prefix]}, "${name}")`)
            }
            if (attrName) {
                conditions.push(
                    attrValue
                        ? `contains(@${attrName}, "${attrValue}")`
                        : `@${attrName}`
                )
            }
            if (partial) {
                conditions.push(`contains(., "${query}")`)
            } else {
                conditions.push(`normalize-space() = "${query}"`)
            }

            using = 'xpath'
            value = `.//${tag || '*'}[${conditions.join(' and ')}]`
        }
    }

    /**
     * ensure selector strategy is supported
     */
    if(!isMobile && isW3C && !W3C_SELECTOR_STRATEGIES.includes(using)){
        throw new Error('InvalidSelectorStrategy') // ToDo: move error to wdio-error package
    }

    return { using, value }
}

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
 * @param  {object} res         body object from response
 * @return {string|undefined}   element id or null if element couldn't be found
 */
export const getElementFromResponse = (res) => {
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
    return UNICODE_CHARACTERS.hasOwnProperty(value) ? [UNICODE_CHARACTERS[value]] : new GraphemeSplitter().splitGraphemes(value)
}

function fetchElementByJSFunction (selector, scope) {
    if (!scope.elementId) {
        return scope.execute(selector)
    }

    const script = ((elem) => (selector).call(elem)).toString().replace('selector', `(${selector.toString()})`)
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

    throw INVALID_SELECTOR_ERROR
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

    throw INVALID_SELECTOR_ERROR
}
