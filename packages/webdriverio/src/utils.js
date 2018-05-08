import fs from 'fs'
import path from 'path'

import { ELEMENT_KEY, W3C_SELECTOR_STRATEGIES } from './constants'

const DEFAULT_SELECTOR = 'css selector'
const DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-ios uiautomation|accessibility id):(.+)/

export const findStrategy = function (value, isW3C) {
    /**
     * set default selector
     */
    let using = DEFAULT_SELECTOR

    if (typeof value !== 'string') {
        throw new Error('selector needs to be typeof `string`')
    }

    /**
     * check if user has specified locator strategy directly
     */
    const match = value.match(DIRECT_SELECTOR_REGEXP)
    if (match) {
        /**
         * ensure selector strategy is supported
         */
        if (isW3C && !W3C_SELECTOR_STRATEGIES.includes(match[1])) {
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

    // use link text strategy if value startes with =
    } else if (value.indexOf('=') === 0) {
        using = 'link text'
        value = value.slice(1)

    // use partial link text strategy if value startes with *=
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

    // use name strategy if value queries elements with name attributes
    // e.g. "[name='myName']" or '[name="myName"]'
    } else if (value.search(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/) >= 0) {
        using = 'name'
        value = value.match(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/)[2]

    // any element with given text e.g. h1=Welcome
    } else if (value.search(/^[a-z0-9]*=(.)+$/) >= 0) {
        let query = value.split(/=/)
        let tag = query.shift()

        using = 'xpath'
        value = `.//${tag.length ? tag : '*'}[normalize-space() = "${query.join('=')}"]`

    // any element containing given text
    } else if (value.search(/^[a-z0-9]*\*=(.)+$/) >= 0) {
        let query = value.split(/\*=/)
        let tag = query.shift()

        using = 'xpath'
        value = `.//${tag.length ? tag : '*'}[contains(., "${query.join('*=')}")]`

    // any element with certain class or id + given content
    } else if (value.search(/^[a-z0-9]*(\.|#)-?[_a-zA-Z]+[_a-zA-Z0-9-]*=(.)+$/) >= 0) {
        let query = value.split(/=/)
        let tag = query.shift()

        let classOrId = tag.substr(tag.search(/(\.|#)/), 1) === '#' ? 'id' : 'class'
        let classOrIdName = tag.slice(tag.search(/(\.|#)/) + 1)

        tag = tag.substr(0, tag.search(/(\.|#)/))
        using = 'xpath'
        value = `.//${tag.length ? tag : '*'}[contains(@${classOrId}, "${classOrIdName}") and normalize-space() = "${query.join('=')}"]`

    // any element with certain class or id + has certain content
    } else if (value.search(/^[a-z0-9]*(\.|#)-?[_a-zA-Z]+[_a-zA-Z0-9-]*\*=(.)+$/) >= 0) {
        let query = value.split(/\*=/)
        let tag = query.shift()

        let classOrId = tag.substr(tag.search(/(\.|#)/), 1) === '#' ? 'id' : 'class'
        let classOrIdName = tag.slice(tag.search(/(\.|#)/) + 1)

        tag = tag.substr(0, tag.search(/(\.|#)/))
        using = 'xpath'
        value = './/' + (tag.length ? tag : '*') + '[contains(@' + classOrId + ', "' + classOrIdName + '") and contains(., "' + query.join('*=') + '")]'
        value = `.//${tag.length ? tag : '*'}[contains(@${classOrId}, "${classOrIdName}") and contains(., "${query.join('*=')}")]`

    // allow to move up to the parent or select current element
    } else if (value === '..' || value === '.') {
        using = 'xpath'
    }

    /**
     * ensure selector strategy is supported
     */
    if (isW3C && !W3C_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error('InvalidSelectorStrategy') // ToDo: move error to wdio-error package
    }

    return { using, value }
}

const applyScopePrototype = (prototype, scope) => {
    const dir = path.resolve(__dirname, 'commands', scope)
    const files = fs.readdirSync(dir)
    for (let filename of files) {
        const commandName = path.basename(filename, path.extname(filename))
        prototype[commandName] = { value: require(path.join(dir, commandName)) }
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
     * depcrecated JSONWireProtocol response
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
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
export function mobileDetector (caps) {
    let isMobile = Boolean(
        (typeof caps['appium-version'] !== 'undefined') ||
        (typeof caps['device-type'] !== 'undefined') || (typeof caps['deviceType'] !== 'undefined') ||
        (typeof caps['device-orientation'] !== 'undefined') || (typeof caps['deviceOrientation'] !== 'undefined') ||
        (typeof caps.deviceName !== 'undefined') ||
        // Check browserName for specific values
        (caps.browserName === '' ||
             (caps.browserName !== undefined && (caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android')))
    )

    let isIOS = Boolean(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i))
    )

    let isAndroid = Boolean(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i))
    )

    return { isMobile, isIOS, isAndroid }
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
    if (!Array.isArray(value)) {
        value = [value]
    }

    for (const [i, val] of Object.entries(value)) {
        if (typeof val === 'string') {
            value = [...value.slice(0, i), ...val.split(''), ...value.slice(i + 1)]
        } else if (typeof val === 'number') {
            value[i] = `${val}`
        } else if (typeof val === 'object') {
            try {
                value[i] = JSON.stringify(val)
            } catch (e) { /* ignore */ }
        } else if (typeof val === 'boolean') {
            value = [...value.slice(0, i), val ? 'true'.split('') : 'false'.split(''), value.slice(i + 1)]
        } else {
            // ignore all others
            value = [...value.slice(0, i), value.slice(i + 1)]
        }
    }

    return value
}
