import logger from '@wdio/logger'
import { ELEMENT_KEY, W3C_SELECTOR_STRATEGIES } from './constants'

const log = logger('webdriverio')
const DEFAULT_STRATEGY = 'css selector'
const DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-ios uiautomation|-ios predicate string|-ios class chain|accessibility id):(.+)/
const INVALID_SELECTOR_ERROR = new Error('selector needs to be typeof `string` or `function`')
const XPATH_SELECTORS_START = [
    '/', '(', '\'../\'', './', '*/'
]
const NAME_MOBILE_SELECTORS_START = [
    'uia', 'xcuielementtype', 'android.widget'
]
const XPATH_SELECTOR_REGEXP = [
    // HTML tag
    /^([a-z0-9|-]*)/,
    // optional . or # + class or id
    /(?:(\.|#)(-?[_a-zA-Z]+[_a-zA-Z0-9-]*))?/,
    // optional [attribute-name="attribute-selector"]
    /(?:\[(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?:=(?:"|')([a-zA-z0-9\-_. ]+)(?:"|'))?\])?/,
    // *=query or =query
    /(\*)?=(.+)$/,
]

const defineStrategy = function (selector) {
    /**
     * check if user has specified locator strategy directly
     */
    if (selector.match(DIRECT_SELECTOR_REGEXP)) {
        return 'directly'
    }
    // use xPath strategy if selector starts with //
    if (XPATH_SELECTORS_START.some(option => selector.indexOf(option) === 0)) {
        return 'xpath'
    }
    // use link text strategy if selector starts with =
    if (selector.indexOf('=') === 0) {
        return 'link text'
    }
    // use partial link text strategy if selector starts with *=
    if (selector.indexOf('*=') === 0) {
        return 'partial link text'
    }
    // recursive element search using the UiAutomator library (Android only)
    if (selector.indexOf('android=') === 0) {
        return '-android uiautomator'
    }
    // recursive element search using the UIAutomation library (iOS-only)
    if (selector.indexOf('ios=') === 0) {
        return '-ios uiautomation'
    }
    // recursive element search using accessibility id
    if (selector.indexOf('~') === 0) {
        return 'accessibility id'
    }
    // class name mobile selector
    // for iOS = UIA...
    // for Android = android.widget
    if (NAME_MOBILE_SELECTORS_START.some(option => selector.toLowerCase().indexOf(option) === 0)) {
        return 'class name'
    }
    // use tag name strategy if selector contains a tag
    // e.g. "<div>" or "<div />"
    if (selector.search(/<[a-zA-Z-]+( \/)*>/g) >= 0) {
        return 'tag name'
    }
    // use name strategy if selector queries elements with name attributes for JSONWP
    // or if isMobile is used even when w3c is used
    // e.g. "[name='myName']" or '[name="myName"]'
    if (selector.search(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/) >= 0) {
        return 'name'
    }
    // allow to move up to the parent or select current element
    if (selector === '..' || selector === '.') {
        return 'xpath'
    }
    // any element with given class, id, or attribute and content
    // e.g. h1.header=Welcome or [data-name=table-row]=Item or #content*=Intro
    if (selector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))) {
        return 'xpath extended'
    }
}
export const findStrategy = function (selector, isW3C, isMobile) {
    /**
     * set default strategy
     */
    let using = DEFAULT_STRATEGY
    let value = selector

    switch (defineStrategy(selector)) {
    // user has specified locator strategy directly
    case 'directly': {
        const match = selector.match(DIRECT_SELECTOR_REGEXP)
        if (!isMobile && isW3C && !W3C_SELECTOR_STRATEGIES.includes(match[1])) {
            throw new Error('InvalidSelectorStrategy') // ToDo: move error to wdio-error package
        }
        using = match[1]
        value = match[2]
        break
    }
    case 'xpath': {
        using = 'xpath'
        break
    }
    case 'link text': {
        using = 'link text'
        value = selector.slice(1)
        break
    }
    case 'partial link text': {
        using = 'partial link text'
        value = selector.slice(2)
        break
    }
    case '-android uiautomator': {
        using = '-android uiautomator'
        value = selector.slice(8)
        break
    }
    case '-ios uiautomation': {
        using = '-ios uiautomation'
        value = selector.slice(4)
        break
    }
    case 'accessibility id': {
        using = 'accessibility id'
        value = selector.slice(1)
        break
    }
    case 'class name': {
        using = 'class name'
        break
    }
    case 'tag name': {
        using = 'tag name'
        value = selector.replace(/<|>|\/|\s/g, '')
        break
    }
    case 'name': {
        if (isMobile || !isW3C) {
            using = 'name'
            value = selector.match(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/)[2]
        }
        break
    }
    case 'xpath extended': {
        using = 'xpath'
        const match = selector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))
        const PREFIX_NAME = { '.': 'class', '#': 'id' }
        const conditions = []
        const [
            tag,
            prefix, name,
            attrName, attrValue,
            partial, query
        ] = match.slice(1)

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
        value = `.//${tag || '*'}[${conditions.join(' and ')}]`
        break
    }
    }

    /**
     * ensure selector strategy is supported
     */
    if (!isMobile && isW3C && !W3C_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error('InvalidSelectorStrategy') // ToDo: move error to wdio-error package
    }

    return { using, value }
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
export function getBrowserObject(elem) {
    return elem.parent ? getBrowserObject(elem.parent) : elem
}

function fetchElementByJSFunction(selector, scope) {
    if (!scope.elementId) {
        return scope.execute(selector)
    }
    /**
     * use a regular function because IE does not understand arrow functions
     */
    const script = (function (elem) {
        return (selector).call(elem)
    }).toString().replace('selector', `(${selector.toString()})`)
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
