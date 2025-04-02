import cssValue from 'css-value'
import rgb2hex from 'rgb2hex'
import GraphemeSplitter from 'grapheme-splitter'
import logger from '@wdio/logger'
import isPlainObject from 'is-plain-obj'
import { type remote, ELEMENT_KEY } from 'webdriver'
import { UNICODE_CHARACTERS, asyncIterators, getBrowserObject } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import * as browserCommands from '../commands/browser.js'
import * as elementCommands from '../commands/element.js'
import * as pageCommands from '../commands/page.js'
import elementContains from '../scripts/elementContains.js'
import querySelectorAllDeep from './thirdParty/querySelectorShadowDom.js'
import { SCRIPT_PREFIX, SCRIPT_SUFFIX } from '../commands/constant.js'
import { DEEP_SELECTOR, Key } from '../constants.js'
import { findStrategy } from './findStrategy.js'
import { getShadowRootManager, type ShadowRootManager } from '../session/shadowRoot.js'
import { getContextManager } from '../session/context.js'
import type { ElementFunction, Selector, ParsedCSSValue, CustomLocatorReturnValue } from '../types.js'
import type { CustomStrategyReference, ExtendedElementReference } from '../types.js'

const log = logger('webdriverio')
const INVALID_SELECTOR_ERROR = 'selector needs to be typeof `string` or `function`'
const IGNORED_COMMAND_FILE_EXPORTS = ['SESSION_MOCKS', 'CDP_SESSIONS']

declare global {
    interface Window { __wdio_element: Record<string, HTMLElement> }
}

type Scopes = 'browser' | 'element' | 'page'

const scopes = {
    browser: browserCommands,
    element: elementCommands,
    page: pageCommands
}

const applyScopePrototype = (
    prototype: Record<string, PropertyDescriptor>,
    scope: Scopes) => {
    Object.entries(scopes[scope])
        .filter(([exportName]) => !IGNORED_COMMAND_FILE_EXPORTS.includes(exportName))
        .forEach(([commandName, command]) => {
            prototype[commandName] = { value: command }
        })
}

/**
 * enhances objects with element commands
 */
export const getPrototype = (scope: Scopes) => {
    const prototype: Record<string, PropertyDescriptor> = {
        /**
         * used to store the puppeteer instance in the browser scope
         */
        puppeteer: { value: null, writable: true }
    }

    if (scope === 'browser') {
        /**
         * Returns a boolean if the current context is the Mobile native context
         */
        prototype.isNativeContext = {
            get: function (this: WebdriverIO.Browser) {
                const context = getContextManager(this)
                return context.isNativeContext
            }
        }
        /**
         * Returns the current mobile context which could be `NATIVE_APP` or `WEBVIEW_***`
         */
        prototype.mobileContext = {
            get: function (this: WebdriverIO.Browser) {
                const context = getContextManager(this)
                return context.mobileContext
            }
        }
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
export const getElementFromResponse = (res?: ElementReference) => {
    /**
     * a function selector can return null
     */
    if (!res) {
        return null
    }

    /**
     * deprecated JSONWireProtocol response
     */
    if ((res as unknown as { ELEMENT: string }).ELEMENT) {
        return (res as unknown as { ELEMENT: string }).ELEMENT
    }

    /**
     * W3C WebDriver response
     */
    if (res[ELEMENT_KEY]) {
        return res[ELEMENT_KEY]
    }

    return null
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
         * remove whitespace in rgb values
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
        } catch {
            // TODO improve css-parse lib to handle properties like
            // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
        }
    }

    return parsedValue
}

/**
 * check for unicode character or split string into literals
 * @param  {string} value  text
 * @return {Array}         set of characters or unicode symbols
 */
export function checkUnicode (value: string) {
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

    return [UNICODE_CHARACTERS[value as keyof typeof UNICODE_CHARACTERS]]
}

function fetchElementByJSFunction (
    selector: ElementFunction,
    scope: WebdriverIO.Browser | WebdriverIO.Element,
    referenceId?: string
): Promise<ElementReference | ElementReference[]> {
    if (!('elementId' in scope)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return scope.execute(selector as any, referenceId)
    }
    /**
     * use a regular function because IE does not understand arrow functions
     */
    const script = (function (elem: HTMLElement, id: string) {
        return (selector as unknown as Function).call(elem, id)
    }).toString().replace('selector', `(${selector.toString()})`)
    const args: (WebdriverIO.Element | string)[] = [scope as WebdriverIO.Element]
    if (referenceId) {
        args.push(referenceId)
    }
    return getBrowserObject(scope).executeScript(`return (${script}).apply(null, arguments)`, args)
}

export function isElement (o: Selector){
    return (
        typeof HTMLElement === 'object'
            ? o instanceof HTMLElement
            : o && typeof o === 'object' && o !== null && (o as HTMLElement).nodeType === 1 && typeof (o as HTMLElement).nodeName==='string'
    )
}

export function isStaleElementError (err: Error) {
    return (
        // Chrome
        err.message.includes('stale element reference') ||
        // Firefox
        err.message.includes('is no longer attached to the DOM') ||
        // Safari
        err.message.toLowerCase().includes('stale element found') ||
        // Chrome through JS execution
        err.message.includes('stale element not found in the current frame') ||
        // BIDI
        err.message.includes('belongs to different document')
    )
}

/**
 * handle promise result (resolved or rejected promises)
 * @param handle browsing context
 * @param shadowRootManager instance of ShadowRootManager
 * @param shadowRootId shadow root id that was inspected
 * @returns a function to handle the result of a shadow root inspection
 */
export function elementPromiseHandler <T extends object>(handle: string, shadowRootManager: ShadowRootManager, shadowRootId?: string) {
    return (el: T | Error) => {
        const errorString = 'error' in el && typeof el.error === 'string'
            ? el.error
            : 'message' in el && typeof el.message === 'string'
                ? el.message
                : undefined

        if (errorString) {
            /**
             * clear up shadow root if it's not attached to the DOM anymore
             */
            if (shadowRootId && errorString.includes('detached shadow root')) {
                shadowRootManager.deleteShadowRoot(shadowRootId, handle)
            }
            return
        }
        return el as T
    }
}

export function transformClassicToBidiSelector (using: string, value: string): remote.BrowsingContextCssLocator | remote.BrowsingContextXPathLocator | remote.BrowsingContextInnerTextLocator {
    if (using === 'css selector' || using === 'tag name') {
        return { type: 'css', value }
    }

    if (using === 'xpath') {
        return { type: 'xpath', value }
    }

    if (using === 'link text') {
        return { type: 'innerText', value }
    }

    if (using === 'partial link text') {
        return { type: 'innerText', value, matchType: 'partial' }
    }

    throw new Error(`Can't transform classic selector ${using} to Bidi selector`)
}

/**
 * Parallel look up of a selector within multiple shadow roots
 * @param this WebdriverIO Browser or Element instance
 * @param selector selector to look up
 * @param isMulti set to true if you call from `$$` command
 * @returns a list of shadow root ids with their corresponding matches or undefined if not found
 */
export async function findDeepElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
): Promise<ElementReference | Error> {
    const browser = getBrowserObject(this)
    const shadowRootManager = getShadowRootManager(browser)
    const contextManager = getContextManager(browser)
    const context = await contextManager.getCurrentContext()

    const shadowRoots = shadowRootManager.getShadowElementsByContextId(
        context,
        (this as WebdriverIO.Element).elementId
    )
    const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
    const locator = transformClassicToBidiSelector(using, value)

    /**
     * look up selector within document and all shadow roots
     */
    const startNodes = shadowRoots.length > 0
        ? shadowRoots.map((shadowRootNodeId) => ({ sharedId: shadowRootNodeId }))
        : (this as WebdriverIO.Element).elementId
            ? [{ sharedId: (this as WebdriverIO.Element).elementId }]
            : undefined
    const deepElementResult = await browser.browsingContextLocateNodes({ locator, context, startNodes }).then(async (result) => {
        let nodes: ExtendedElementReference[] = result.nodes.filter((node) => Boolean(node.sharedId)).map((node) => ({
            [ELEMENT_KEY]: node.sharedId as string,
            locator
        }))

        nodes = returnUniqueNodes(nodes)

        if (!(this as WebdriverIO.Element).elementId) {
            return nodes[0]
        }

        /**
         * determine if node is within tree of current element
         */
        const scopedNodes = await Promise.all(nodes.map(async (node) => {
            const isIn = await browser.execute(
                elementContains,
                { [ELEMENT_KEY]: (this as WebdriverIO.Element).elementId } as unknown as HTMLElement,
                node as unknown as HTMLElement
            )
            return [isIn, node]
        })).then((elems) => elems.filter(([isIn]) => isIn).map(([, elem]) => elem))

        return scopedNodes[0]
    }, (err) => {
        log.warn(`Failed to execute browser.browsingContextLocateNodes({ ... }) due to ${err}, falling back to regular WebDriver Classic command`)
        return this && 'elementId' in this && this.elementId
            ? this.findElementFromElement(this.elementId, using, value)
            : browser.findElement(using, value)
    })

    if (!deepElementResult) {
        return new Error(`Couldn't find element with selector "${selector}"`)
    }

    return deepElementResult as ElementReference
}

/**
 * Parallel look up of a selector within multiple shadow roots
 * @param this WebdriverIO Browser or Element instance
 * @param selector selector to look up
 * @param isMulti set to true if you call from `$$` command
 * @returns a list of shadow root ids with their corresponding matches or undefined if not found
 */
export async function findDeepElements(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
): Promise<ElementReference[]> {
    const browser = getBrowserObject(this)
    const shadowRootManager = getShadowRootManager(browser)
    const contextManager = getContextManager(browser)
    const context = await contextManager.getCurrentContext()

    const shadowRoots = shadowRootManager.getShadowElementsByContextId(
        context,
        (this as WebdriverIO.Element).elementId
    )
    const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
    const locator = transformClassicToBidiSelector(using, value)

    /**
     * look up selector within document and all shadow roots
     */
    const startNodes = shadowRoots.length > 0
        ? shadowRoots.map((shadowRootNodeId) => ({ sharedId: shadowRootNodeId }))
        : (this as WebdriverIO.Element).elementId
            ? [{ sharedId: (this as WebdriverIO.Element).elementId }]
            : undefined
    const deepElementResult = await browser.browsingContextLocateNodes({ locator, context, startNodes }).then(async (result) => {
        let nodes: ExtendedElementReference[] = result.nodes.filter((node) => Boolean(node.sharedId))
            .map((node) => ({
                [ELEMENT_KEY]: node.sharedId as string,
                locator
            }))

        nodes = returnUniqueNodes(nodes)

        if (!(this as WebdriverIO.Element).elementId) {
            return nodes
        }

        /**
         * determine if node is within tree of current element
         */
        const scopedNodes = await Promise.all(nodes.map(async (node) => {
            const isIn = await browser.execute(
                elementContains,
                { [ELEMENT_KEY]: (this as WebdriverIO.Element).elementId } as unknown as HTMLElement,
                node as unknown as HTMLElement
            )
            return [isIn, node]
        })).then((elems) => elems.filter(([isIn]) => isIn).map(([, elem]) => elem))

        return scopedNodes
    }, (err) => {
        log.warn(`Failed to execute browser.browsingContextLocateNodes({ ... }) due to ${err}, falling back to regular WebDriver Classic command`)
        return this && 'elementId' in this && this.elementId
            ? this.findElementsFromElement(this.elementId, using, value)
            : browser.findElements(using, value)
    })
    return deepElementResult as ElementReference[]
}

/**
* Temporary patch for https://github.com/mozilla/geckodriver/issues/2223
*/
function returnUniqueNodes(nodes: ExtendedElementReference[]): ExtendedElementReference[] {
    const ids = new Set()
    return nodes.filter((node) => !ids.has(node[ELEMENT_KEY]) && ids.add(node[ELEMENT_KEY]))
}

/**
 * logic to find an element
 * Note: the order of if statements matters
 */
export async function findElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
) {
    const browserObject = getBrowserObject(this)
    const shadowRootManager = getShadowRootManager(browserObject)

    /**
     * do a deep lookup if
     * - we are using Bidi
     * - have a string selector
     * - that is not a deep selector
     * - and we are not in an iframe (because it is currently not supported to locate nodes in an iframe via Bidi)
     */
    if (this.isBidi && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR) && !shadowRootManager.isWithinFrame()) {
        return findDeepElement.call(this, selector)
    }

    /**
     * check if shadow DOM integration is used
     */
    if (typeof selector === 'string' && selector.startsWith(DEEP_SELECTOR)) {
        const notFoundError = new Error(`shadow selector "${selector.slice(DEEP_SELECTOR.length)}" did not return an HTMLElement`)
        let elem: ElementReference | ElementReference[] = await browserObject.execute(
            querySelectorAllDeep,
            false,
            selector.slice(DEEP_SELECTOR.length),
            // hard conversion from element id to Element is done by browser driver
            ((this as WebdriverIO.Element).elementId ? this : undefined) as unknown as Element | Document
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
            ? this.findElementFromElement((this as WebdriverIO.Element).elementId, using, value) as unknown as ElementReference
            : this.findElement(using, value) as unknown as ElementReference
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
        selector = ((id: string) => window.__wdio_element[id]) as unknown as ElementFunction
        let elem = await fetchElementByJSFunction(selector, this, uid).catch((err) => {
            /**
             * WebDriver throws a stale element reference error if the element is not found
             * and therefor can't be serialized
             */
            if (isStaleElementError(err)) {
                return undefined
            }
            throw err
        })
        elem = Array.isArray(elem) ? elem[0] : elem
        return getElementFromResponse(elem) ? elem : notFoundError
    }

    throw new Error(`${INVALID_SELECTOR_ERROR}, but found: \`${typeof selector}\``)
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
    if (typeof selector === 'string' && selector.startsWith(DEEP_SELECTOR)) {
        const elems: ElementReference | ElementReference[] = await browserObject.execute(
            querySelectorAllDeep,
            true,
            selector.slice(DEEP_SELECTOR.length),
            // hard conversion from element id to Element is done by browser driver
            ((this as WebdriverIO.Element).elementId ? this : undefined) as unknown as Element | Document
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
            ? this.findElementsFromElement((this as WebdriverIO.Element).elementId, using, value) as unknown as ElementReference[]
            : this.findElements(using, value) as unknown as ElementReference[]
    }

    /**
     * fetch element with JS function
     */
    if (typeof selector === 'function') {
        const elems = await fetchElementByJSFunction(selector, this)
        const elemArray = Array.isArray(elems) ? elems as ElementReference[] : [elems]
        return elemArray.filter((elem) => elem && getElementFromResponse(elem))
    }

    throw new Error(`${INVALID_SELECTOR_ERROR}, but found: \`${typeof selector}\``)
}

/**
 * Strip element object and return w3c and jsonwp compatible keys
 */
export function verifyArgsAndStripIfElement(args: unknown) {
    function verify (arg: unknown) {
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
        }, scope as unknown as HTMLElement)

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
    } catch {
        /**
         * if even adding http:// doesn't help, fail with original error
         */
        if (origError) {
            throw origError
        }

        return validateUrl(`http://${url}`, new Error(`Invalid URL: ${url}`))
    }
}

export async function hasElementId (element: WebdriverIO.Element) {
    /*
     * This is only necessary as isDisplayed is on the exclusion list for the middleware
     */
    if (!element.elementId) {
        const command = element.isReactElement
            ? element.parent.react$.bind(element.parent)
            : element.isShadowElement
                ? element.parent.shadow$.bind(element.parent)
                : element.parent.$.bind(element.parent)
        element.elementId = (await command(element.selector as string).getElement()).elementId
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

type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][]

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
    elements: WebdriverIO.Element[],
    parent: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[],
    foundWith = '$$',
    props: unknown[] = []
) => {
    /**
     * as we enhance the element array in this method we need to cast its
     * type as well
     */
    const elementArray = elements as unknown as WebdriverIO.ElementArray

    /**
     * if we have an element collection, e.g. `const elems = $$([elemA, elemB])`
     * we can't assign a common selector to the element array
     */
    if (!Array.isArray(selector)) {
        elementArray.selector = selector
    }

    /**
     * if all elements have the same selector we actually can assign a selector
     */
    const elems = selector as WebdriverIO.Element[]
    if (Array.isArray(selector) && elems.length && elems.every((elem) => elem.selector && elem.selector === elems[0].selector)) {
        elementArray.selector = elems[0].selector
    }

    /**
     * replace Array prototype methods with custom ones that support
     * async iterators
     */
    for (const [name, fn] of Object.entries(asyncIterators) as Entries<typeof asyncIterators>) {
        /**
         * ToDo(Christian): typing fails here for unknown reason
         */
        elementArray[name] = fn.bind(null, elementArray as unknown)
    }

    elementArray.parent = parent
    elementArray.foundWith = foundWith
    elementArray.props = props
    elementArray.getElements = async () => elementArray
    return elementArray
}

/**
 * is protocol stub
 * @param {string} automationProtocol
 */
export const isStub = (automationProtocol?: string) => automationProtocol === './protocol-stub.js'

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

export function createFunctionDeclarationFromString (userScript: Function | string) {
    if (typeof userScript === 'string') {
        return `(${SCRIPT_PREFIX}function () {\n${userScript.toString()}\n}${SCRIPT_SUFFIX}).apply(this, arguments);`
    }
    return new Function(`return (${SCRIPT_PREFIX}${userScript.toString()}${SCRIPT_SUFFIX}).apply(this, arguments);`).toString()
}
