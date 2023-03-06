import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { URL } from 'node:url'

import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import GraphemeSplitter from 'grapheme-splitter'
import logger from '@wdio/logger'
import isPlainObject from 'is-plain-obj'
import { SUPPORTED_BROWSER } from 'devtools'
import { UNICODE_CHARACTERS } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'
import type { Options, Capabilities } from '@wdio/types'

import * as browserCommands from '../commands/browser.js'
import * as elementCommands from '../commands/element.js'
import querySelectorAllDeep from './thirdParty/querySelectorShadowDom.js'
import { ELEMENT_KEY, DRIVER_DEFAULT_ENDPOINT, DEEP_SELECTOR, Key } from '../constants.js'
import { findStrategy } from './findStrategy.js'
import type { ElementArray, ElementFunction, Selector, ParsedCSSValue, CustomLocatorReturnValue } from '../types.js'
import type { CustomStrategyReference } from '../types.js'

const log = logger('webdriverio')
const INVALID_SELECTOR_ERROR = 'selector needs to be typeof `string` or `function`'
const IGNORED_COMMAND_FILE_EXPORTS = ['SESSION_MOCKS']

declare global {
    interface Window { __wdio_element: Record<string, HTMLElement> }
}

const scopes = {
    browser: browserCommands,
    element: elementCommands
}

const applyScopePrototype = (
    prototype: Record<string, PropertyDescriptor>,
    scope: 'browser' | 'element') => {
    Object.entries(scopes[scope])
        .filter(([exportName]) => !IGNORED_COMMAND_FILE_EXPORTS.includes(exportName))
        .forEach(([commandName, command]) => {
            prototype[commandName] = { value: command }
        })
}

/**
 * enhances objects with element commands
 */
export const getPrototype = (scope: 'browser' | 'element') => {
    const prototype: Record<string, PropertyDescriptor> = {
        /**
         * used to store the puppeteer instance in the browser scope
         */
        puppeteer: { value: null, writable: true }
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
export const getElementFromResponse = (res: ElementReference) => {
    /**
    * a function selector can return null
    */
    if (!res) {
        return null
    }

    /**
     * deprecated JSONWireProtocol response
     */
    if ((res as any).ELEMENT) {
        return (res as any as { ELEMENT: string }).ELEMENT
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
export function getBrowserObject (elem: WebdriverIO.Element | WebdriverIO.Browser): WebdriverIO.Browser {
    const elemObject = elem as WebdriverIO.Element
    return (elemObject as WebdriverIO.Element).parent ? getBrowserObject(elemObject.parent) : elem as WebdriverIO.Browser
}

function sanitizeCSS (value?: string) {
    /* istanbul ignore next */
    if (!value) {
        return value
    }

    return value.trim().replace(/'/g, '').replace(/"/g, '').toLowerCase()
}

/**
 * parse css values to a better format
 * @param  {string} cssPropertyValue result of WebDriver call
 * @param  {string} cssProperty      name of css property to parse
 * @return {object}                  parsed css property
 */
export function parseCSS (cssPropertyValue: string, cssProperty?: string) {
    const parsedValue: ParsedCSSValue = {
        property: cssProperty,
        value: cssPropertyValue.toLowerCase().trim(),
        parsed: {}
    }

    if (parsedValue.value?.indexOf('rgb') === 0) {
        /**
         * remove whitespaces in rgb values
         */
        parsedValue.value = parsedValue.value.replace(/\s/g, '')

        /**
         * parse color values
         */
        const color = parsedValue.value
        parsedValue.parsed = rgb2hex(parsedValue.value)
        parsedValue.parsed.type = 'color'

        const colorType = /[rgba]+/g.exec(color) || []
        parsedValue.parsed[colorType[0] as 'rgb' | 'rgba'] = color
    } else if (parsedValue.property === 'font-family') {
        const font = cssValue(cssPropertyValue)
        const string = parsedValue.value
        const value = cssPropertyValue.split(/,/).map(sanitizeCSS)

        parsedValue.value = sanitizeCSS(font[0].value as string || font[0].string)
        parsedValue.parsed = { value, type: 'font', string }
    } else {
        /**
         * parse other css properties
         */
        try {
            const value = cssValue(cssPropertyValue)

            if (value.length === 1) {
                parsedValue.parsed = value[0]
            }

            if (parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
                parsedValue.value = parsedValue.parsed.value
            }
        } catch (err: any) {
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
export function checkUnicode (value: string, isDevTools = false) {
    /**
     * "Ctrl" key is specially handled based on OS in action class
     */
    if (value === Key.Ctrl) {
        return [value]
    }
    /**
     * when sending emoji characters like 😄 or a value that is not a special character defined
     * by the WebDriver protocol
     */
    if (!Object.prototype.hasOwnProperty.call(UNICODE_CHARACTERS, value)) {
        return new GraphemeSplitter().splitGraphemes(value)
    }

    if (isDevTools) {
        return [value]
    }

    return [UNICODE_CHARACTERS[value as keyof typeof UNICODE_CHARACTERS]]
}

function fetchElementByJSFunction (
    selector: ElementFunction,
    scope: WebdriverIO.Browser | WebdriverIO.Element,
    referenceId?: string
): Promise<ElementReference | ElementReference[]> {
    if (!(scope as WebdriverIO.Element).elementId) {
        return scope.execute(selector as any, referenceId)
    }
    /**
     * use a regular function because IE does not understand arrow functions
     */
    const script = (function (elem: HTMLElement, id: string) {
        return (selector as any as Function).call(elem, id)
    }).toString().replace('selector', `(${selector.toString()})`)
    const args: (WebdriverIO.Element | string)[] = [scope as WebdriverIO.Element]
    if (referenceId) {
        args.push(referenceId)
    }
    return getBrowserObject(scope).execute(`return (${script}).apply(null, arguments)`, ...args)
}

export function isElement (o: Selector){
    return (
        typeof HTMLElement === 'object'
            ? o instanceof HTMLElement
            : o && typeof o === 'object' && o !== null && (o as HTMLElement).nodeType === 1 && typeof (o as HTMLElement).nodeName==='string'
    )
}

/**
 * logic to find an element
 */
export async function findElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
) {
    const browserObject = getBrowserObject(this)

    /**
     * check if shadow DOM integration is used
     */
    if (!this.isDevTools && typeof selector === 'string' && selector.startsWith(DEEP_SELECTOR)) {
        const notFoundError = new Error(`shadow selector "${selector.slice(DEEP_SELECTOR.length)}" did not return an HTMLElement`)
        let elem: ElementReference | ElementReference[] = await browserObject.execute(
            `return (${querySelectorAllDeep}).apply(null, arguments)`,
            false,
            selector.slice(DEEP_SELECTOR.length),
            // hard conversion from element id to Element is done by browser driver
            ((this as WebdriverIO.Element).elementId ? this : undefined) as any as Element | Document
        )
        elem = Array.isArray(elem) ? elem[0] : elem
        return getElementFromResponse(elem) ? elem : notFoundError
    }

    /**
     * fetch element using custom strategy function
     */
    if (selector && typeof selector === 'object' && typeof (selector as CustomStrategyReference).strategy === 'function') {
        const { strategy, strategyName, strategyArguments } = selector as CustomStrategyReference
        const notFoundError = new Error(`Custom Strategy "${strategyName}" did not return an HTMLElement`)
        let elem = await browserObject.execute(strategy, ...strategyArguments)
        elem = Array.isArray(elem) ? elem[0] : elem
        return getElementFromResponse(elem) ? elem : notFoundError
    }

    /**
     * fetch element using regular protocol command
     */
    if (typeof selector === 'string' || isPlainObject(selector)) {
        const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
        return (this as WebdriverIO.Element).elementId
            // casting to any necessary given weak type support of protocol commands
            ? this.findElementFromElement((this as WebdriverIO.Element).elementId, using, value) as any as ElementReference
            : this.findElement(using, value) as any as ElementReference
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

    /**
     * handle DOM element transformation
     * Note: this runs in the browser
     */
    if (isElement(selector)) {
        if (!window.__wdio_element) {
            window.__wdio_element = {}
        }
        const notFoundError = new Error('DOM Node couldn\'t be found anymore')
        const uid = Math.random().toString().slice(2)
        window.__wdio_element[uid] = selector as HTMLElement
        selector = ((id: string) => window.__wdio_element[id]) as any as ElementFunction
        let elem = await fetchElementByJSFunction(selector, this, uid)
        elem = Array.isArray(elem) ? elem[0] : elem
        return getElementFromResponse(elem) ? elem : notFoundError
    }

    throw new Error(INVALID_SELECTOR_ERROR)
}

/**
 * logic to find a elements
 */
export async function findElements(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
) {
    const browserObject = getBrowserObject(this)

    /**
     * check if shadow DOM integration is used
     */
    if (!this.isDevTools && typeof selector === 'string' && selector.startsWith(DEEP_SELECTOR)) {
        const elems: ElementReference | ElementReference[] = await browserObject.execute(
            `return (${querySelectorAllDeep}).apply(null, arguments)`,
            true,
            selector.slice(DEEP_SELECTOR.length),
            // hard conversion from element id to Element is done by browser driver
            ((this as WebdriverIO.Element).elementId ? this : undefined) as any as Element | Document
        )
        const elemArray = Array.isArray(elems) ? elems : [elems]
        return elemArray.filter((elem) => elem && getElementFromResponse(elem))
    }

    /**
     * fetch elements using custom strategy function
     */
    if (isPlainObject(selector) && typeof (selector as CustomStrategyReference).strategy === 'function') {
        const { strategy, strategyArguments } = selector as CustomStrategyReference
        const elems = await browserObject.execute(strategy, ...strategyArguments)
        const elemArray = Array.isArray(elems) ? elems as ElementReference[] : [elems]
        return elemArray.filter((elem) => elem && getElementFromResponse(elem))
    }

    /**
     * fetch element using regular protocol command
     */
    if (typeof selector === 'string' || isPlainObject(selector)) {
        const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
        return (this as WebdriverIO.Element).elementId
            // casting to any necessary given weak type support of protocol commands
            ? this.findElementsFromElement((this as WebdriverIO.Element).elementId, using, value) as any as ElementReference[]
            : this.findElements(using, value) as any as ElementReference[]
    }

    /**
     * fetch element with JS function
     */
    if (typeof selector === 'function') {
        const elems = await fetchElementByJSFunction(selector, this)
        const elemArray = Array.isArray(elems) ? elems as ElementReference[] : [elems]
        return elemArray.filter((elem) => elem && getElementFromResponse(elem))
    }

    throw new Error(INVALID_SELECTOR_ERROR)
}

/**
 * Strip element object and return w3c and jsonwp compatible keys
 */
export function verifyArgsAndStripIfElement(args: any) {
    function verify (arg: any) {
        if (arg && typeof arg === 'object' && arg.constructor.name === 'Element') {
            const elem = arg as WebdriverIO.Element
            if (!elem.elementId) {
                throw new Error(`The element with selector "${elem.selector}" you are trying to pass into the execute method wasn't found`)
            }

            return {
                [ELEMENT_KEY]: elem.elementId,
                ELEMENT: elem.elementId
            }
        }

        return arg
    }

    return !Array.isArray(args) ? verify(args) : args.map(verify)
}

/**
 * getElementRect
 */
export async function getElementRect(scope: WebdriverIO.Element) {
    const rect = await scope.getElementRect(scope.elementId)

    const defaults = { x: 0, y: 0, width: 0, height: 0 }

    /**
     * getElementRect workaround for Safari 12.0.3
     * if one of [x, y, height, width] is undefined get rect with javascript
     */
    if (Object.keys(defaults).some((key: keyof typeof defaults) => rect[key] === undefined)) {
        /* istanbul ignore next */
        const rectJs = await getBrowserObject(scope).execute(function (this: Window, el: HTMLElement) {
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
        }, scope as any as HTMLElement)

        // try set proper value
        Object.keys(defaults).forEach((key: keyof typeof defaults) => {
            if (typeof rect[key] !== 'undefined') {
                return
            }
            if (rectJs && typeof rectJs[key] === 'number') {
                rect[key] = Math.floor(rectJs[key])
            } else {
                log.error('getElementRect', { rect, rectJs, key })
                throw new Error('Failed to receive element rects via execute command')
            }
        })
    }

    return rect
}

export function getAbsoluteFilepath(filepath: string) {
    return filepath.startsWith('/') || filepath.startsWith('\\') || filepath.match(/^[a-zA-Z]:\\/)
        ? filepath
        : path.join(process.cwd(), filepath)
}

/**
 * check if directory exists
 */
export async function assertDirectoryExists(filepath: string) {
    const exist = await fs.access(path.dirname(filepath)).then(() => true, () => false)
    if (!exist) {
        throw new Error(`directory (${path.dirname(filepath)}) doesn't exist`)
    }
}

/**
 * check if urls are valid and fix them if necessary
 * @param  {string}  url                url to navigate to
 * @param  {Boolean} [retryCheck=false] true if an url was already check and still failed with fix applied
 * @return {string}                     fixed url
 */
export function validateUrl (url: string, origError?: Error): string {
    try {
        const urlObject = new URL(url)
        return urlObject.href
    } catch (err: any) {
        /**
         * if even adding http:// doesn't help, fail with original error
         */
        if (origError) {
            throw origError
        }

        return validateUrl(`http://${url}`, new Error(`Invalid URL: ${url}`))
    }
}

/**
 * get window's scrollX and scrollY
 * @param {object} scope
 */
export function getScrollPosition (scope: WebdriverIO.Element) {
    return getBrowserObject(scope)
        .execute(/* istanbul ignore next */function (this: Window) {
            return { scrollX: this.pageXOffset, scrollY: this.pageYOffset }
        })
}

export async function hasElementId (element: WebdriverIO.Element) {
    /*
     * This is only necessary as isDisplayed is on the exclusion list for the middleware
     */
    if (!element.elementId) {
        const command = element.isReactElement
            ? element.parent.react$.bind(element.parent)
            : element.parent.$.bind(element.parent)
        element.elementId = (await command(element.selector as string)).elementId
    }

    /*
     * if element was still not found it also is not displayed
     */
    if (!element.elementId) {
        return false
    }
    return true
}

export function addLocatorStrategyHandler(scope: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    return (name: string, func: (selector: string, root?: HTMLElement) => CustomLocatorReturnValue) => {
        if (scope.strategies.get(name)) {
            throw new Error(`Strategy ${name} already exists`)
        }

        scope.strategies.set(name, func)
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
export const enhanceElementsArray = (
    elements: ElementArray,
    parent: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[],
    foundWith = '$$',
    props: any[] = []
) => {
    /**
     * if we have an element collection, e.g. `const elems = $$([elemA, elemB])`
     * we cna't assign a common selector to the element array
     */
    if (!Array.isArray(selector)) {
        elements.selector = selector
    }

    elements.parent = parent
    elements.foundWith = foundWith
    elements.props = props
    return elements
}

/**
 * is protocol stub
 * @param {string} automationProtocol
 */
export const isStub = (automationProtocol?: string) => automationProtocol === './protocol-stub.js'

export const getAutomationProtocol = async (config: Options.WebdriverIO | Options.Testrunner) => {
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
    const caps = (
        ((config as Options.WebdriverIO).capabilities as Capabilities.W3CCapabilities)?.alwaysMatch ||
        config.capabilities as Capabilities.Capabilities
    ) || {}
    const desiredCaps = caps as Capabilities.DesiredCapabilities
    if (!SUPPORTED_BROWSER.includes(caps.browserName?.toLowerCase() as string)) {
        return 'webdriver'
    }

    /**
     * check if we are on mobile and use WebDriver if so
     */
    if (
        desiredCaps.deviceName || caps['appium:deviceName'] ||
        caps['appium:platformVersion'] ||
        desiredCaps.app || caps['appium:app']
    ) {
        return 'webdriver'
    }

    /**
     * run WebDriver if capabilities clearly identify it as it
     */
    if (config.capabilities && ((config as Options.WebdriverIO).capabilities as Capabilities.W3CCapabilities).alwaysMatch) {
        return 'webdriver'
    }

    /**
     * make a head request to check if a driver is available
     */
    const resp: http.IncomingMessage | { error: Error } = await new Promise((resolve) => {
        const req = http.request(DRIVER_DEFAULT_ENDPOINT, resolve)
        req.on('error', (error) => resolve({ error }))
        req.end()
    })

    /**
     * kill agent otherwise process will stale
     */
    const driverEndpointHeaders = resp as http.IncomingMessage
    if ((driverEndpointHeaders as any).req && (driverEndpointHeaders as any).req.agent) {
        (driverEndpointHeaders as any).req.agent.destroy()
    }

    if (driverEndpointHeaders && driverEndpointHeaders.statusCode === 200) {
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
export const updateCapabilities = (
    params: Options.WebdriverIO | Options.Testrunner,
    automationProtocol?: Options.SupportedProtocols
) => {
    if (automationProtocol && !params.automationProtocol) {
        params.automationProtocol = automationProtocol
    }
}

/**
 * compare if an object (`base`) contains the same values as another object (`match`)
 * @param {object} base  object to compare to
 * @param {object} match object that needs to match thebase
 */
export const containsHeaderObject = (
    base: Record<string, string>,
    match: Record<string, string>
) => {
    for (const [key, value] of Object.entries(match)) {
        if (typeof base[key] === 'undefined' || base[key] !== value) {
            return false
        }
    }

    return true
}
