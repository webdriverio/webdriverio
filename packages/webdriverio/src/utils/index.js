import fs from 'fs'
import http from 'http'
import path from 'path'
import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import getPort from 'get-port'
import GraphemeSplitter from 'grapheme-splitter'
import logger from '@wdio/logger'
import isObject from 'lodash.isobject'
import isPlainObject from 'lodash.isplainobject'
import { URL } from 'url'
import { SUPPORTED_BROWSER } from 'devtools'

import { ELEMENT_KEY, UNICODE_CHARACTERS, DRIVER_DEFAULT_ENDPOINT, FF_REMOTE_DEBUG_ARG } from '../constants'
import { findStrategy } from './findStrategy'

const browserCommands = require('../commands/browser')
const elementCommands = require('../commands/element')

const log = logger('webdriverio')
const INVALID_SELECTOR_ERROR = 'selector needs to be typeof `string` or `function`'

const scopes = {
    browser: browserCommands,
    element: elementCommands
}

const applyScopePrototype = (prototype, scope) => {
    Object.entries(scopes[scope]).forEach(([commandName, command]) => {
        prototype[commandName] = { value: command }
    })
}

/**
 * enhances objects with element commands
 */
export const getPrototype = (scope) => {
    const prototype = {
        /**
         * used to store the puppeteer instance in the browser scope
         */
        puppeteer: { value: null, writable: true },
        /**
         * for handling sync execution in @wdio/sync
         */
        _NOT_FIBER: { value: false, writable: true, configurable: true }
    }

    /**
     * register action commands
     */
    applyScopePrototype(prototype, scope)
    prototype.strategies = { value: new Map() }

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
export function transformToCharString (value, translateToUnicode = true) {
    const ret = []

    if (!Array.isArray(value)) {
        value = [value]
    }

    for (const val of value) {
        if (typeof val === 'string') {
            translateToUnicode ? ret.push(...checkUnicode(val)) : ret.push(...`${val}`.split(''))
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
export function checkUnicode (value, isDevTools) {
    return Object.prototype.hasOwnProperty.call(UNICODE_CHARACTERS, value)
        ? isDevTools ? [value] : [UNICODE_CHARACTERS[value]]
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
    if (typeof selector === 'string' || isPlainObject(selector)) {
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
    if (typeof selector === 'string' || isPlainObject(selector)) {
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

/**
 * get window's scrollX and scrollY
 * @param {object} scope
 */
export function getScrollPosition (scope) {
    return getBrowserObject(scope).execute('return { scrollX: this.pageXOffset, scrollY: this.pageYOffset };')
}

export async function hasElementId (element) {
    /*
     * This is only necessary as isDisplayed is on the exclusion list for the middleware
     */
    if (!element.elementId) {
        const method = element.isReactElement ? 'react$' : '$'

        element.elementId = (await element.parent[method](element.selector)).elementId
    }

    /*
     * if element was still not found it also is not displayed
     */
    if (!element.elementId) {
        return false
    }
    return true
}

export function addLocatorStrategyHandler(scope) {
    return (name, script) => {
        if (scope.strategies.get(name)) {
            throw new Error(`Strategy ${name} already exists`)
        }

        scope.strategies.set(name, script)
    }
}

/**
 * Enhance elements array with data required to refetch it
 * @param   {object[]}          elements    elements
 * @param   {object}            parent      element or browser
 * @param   {string|Function}   selector    string or function, or strategy name for `custom$$`
 * @param   {string}            foundWith   name of the command elements were found with, ex `$$`, `react$$`, etc
 * @param   {Array}             props       additional properties required to fetch elements again
 * @returns {object[]}  elements
 */
export const enhanceElementsArray = (elements, parent, selector, foundWith = '$$', props = []) => {
    elements.parent = parent
    elements.selector = selector
    elements.foundWith = foundWith
    elements.props = props
    return elements
}

/**
 * is protocol stub
 * @param {string} automationProtocol
 */
export const isStub = (automationProtocol) => automationProtocol === './protocol-stub'

export const getAutomationProtocol = async (config) => {
    /**
     * if automation protocol is set by user prefer this
     */
    if (config.automationProtocol) {
        return config.automationProtocol
    }

    /**
     * run WebDriver if hostname or port is set
     */
    if (config.hostname || config.port || config.path || (config.user && config.key)) {
        return 'webdriver'
    }

    /**
     * only run DevTools protocol if capabilities match supported platforms
     */
    if (
        config.capabilities &&
        typeof config.capabilities.browserName === 'string' &&
        !SUPPORTED_BROWSER.includes(config.capabilities.browserName.toLowerCase())
    ) {
        return 'webdriver'
    }

    /**
     * make a head request to check if a driver is available
     */
    const driverEndpointHeaders = await new Promise((resolve) => {
        const req = http.request(DRIVER_DEFAULT_ENDPOINT, resolve)
        req.on('error', (error) => resolve({ error }))
        req.end()
    })

    /**
     * kill agent otherwise process will stale
     */
    if (driverEndpointHeaders.req && driverEndpointHeaders.req.agent) {
        driverEndpointHeaders.req.agent.destroy()
    }

    if (driverEndpointHeaders && parseInt(driverEndpointHeaders.statusCode, 10) === 200) {
        return 'webdriver'
    }

    return 'devtools'
}

/**
 * updateCapabilities allows modifying capabilities before session
 * is started
 *
 * NOTE: this method is executed twice when running the WDIO testrunner
 */
export const updateCapabilities = async (params, automationProtocol) => {
    /**
     * attach remote debugging port options to Firefox sessions
     * (this will be ignored if not supported)
     */
    if (automationProtocol === 'webdriver' && params.capabilities.browserName === 'firefox') {
        if (!params.capabilities['moz:firefoxOptions']) {
            params.capabilities['moz:firefoxOptions'] = {}
        }

        if (!params.capabilities['moz:firefoxOptions'].args) {
            params.capabilities['moz:firefoxOptions'].args = []
        }

        if (!params.capabilities['moz:firefoxOptions'].args.includes(FF_REMOTE_DEBUG_ARG)) {
            params.capabilities['moz:firefoxOptions'].args.push(
                FF_REMOTE_DEBUG_ARG,
                (await getPort()).toString()
            )
        }
    }
}

/**
 * compare if an object (`base`) contains the same values as another object (`match`)
 * @param {object} base  object to compare to
 * @param {object} match object that needs to match thebase
 */
export const containsHeaderObject = (base, match) => {
    for (const [key, value] of Object.entries(match)) {
        if (typeof base[key] === 'undefined' || base[key] !== value) {
            return false
        }
    }

    return true
}
