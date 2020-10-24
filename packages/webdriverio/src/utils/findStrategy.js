import { W3C_SELECTOR_STRATEGIES } from '../constants'
import isPlainObject from 'lodash.isplainobject'

const DEFAULT_STRATEGY = 'css selector'
const DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-android datamatcher|-android viewmatcher|-android viewtag|-ios uiautomation|-ios predicate string|-ios class chain|accessibility id):(.+)/
const XPATH_SELECTORS_START = [
    '/', '(', '../', './', '*/'
]
const NAME_MOBILE_SELECTORS_START = [
    'uia', 'xcuielementtype', 'android.widget', 'cyi'
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
const IMAGEPATH_MOBILE_SELECTORS_ENDSWITH = [
    '.jpg', '.jpeg', '.gif', '.png', '.bmp', '.svg'
]

const defineStrategy = function (selector) {
    // Condition with checking isPlainObject(selector) should be first because
    // in case of "selector" argument is a plain object then .match() will cause
    // an error like "selector.match is not a function"
    // Use '-android datamatcher' or '-android viewmatcher' strategy if selector is a plain object (Android only)
    if (isPlainObject(selector)) {
        if (JSON.stringify(selector).indexOf('test.espresso.matcher.ViewMatchers') < 0)
            return '-android datamatcher'
        return '-android viewmatcher'
    }
    // Check if user has specified locator strategy directly
    if (selector.match(DIRECT_SELECTOR_REGEXP)) {
        return 'directly'
    }
    // Use appium image strategy if selector ends with certain text(.jpg,.gif..)
    if (IMAGEPATH_MOBILE_SELECTORS_ENDSWITH.some(path=> selector.toLowerCase().endsWith(path))) {
        return '-image'
    }
    // Use xPath strategy if selector starts with //
    if (XPATH_SELECTORS_START.some(option => selector.startsWith(option))) {
        return 'xpath'
    }
    // Use link text strategy if selector starts with =
    if (selector.startsWith('=')) {
        return 'link text'
    }
    // Use partial link text strategy if selector starts with *=
    if (selector.startsWith('*=')) {
        return 'partial link text'
    }
    // Use id strategy if the selector starts with id=
    if (selector.startsWith('id=')) {
        return 'id'
    }
    // Recursive element search using the UiAutomator library (Android only)
    if (selector.startsWith('android=')) {
        return '-android uiautomator'
    }
    // Recursive element search using the UIAutomation library (iOS-only)
    if (selector.startsWith('ios=')) {
        return '-ios uiautomation'
    }
    // Recursive element search using accessibility id
    if (selector.startsWith('~')) {
        return 'accessibility id'
    }
    // Class name mobile selector
    // for iOS = UIA...
    // for Android = android.widget
    if (NAME_MOBILE_SELECTORS_START.some(option => selector.toLowerCase().startsWith(option))) {
        return 'class name'
    }
    // Use tag name strategy if selector contains a tag
    // e.g. "<div>" or "<div />"
    if (selector.search(/<[0-9a-zA-Z-]+( \/)*>/g) >= 0) {
        return 'tag name'
    }
    // Use name strategy if selector queries elements with name attributes for JSONWP
    // or if isMobile is used even when w3c is used
    // e.g. "[name='myName']" or '[name="myName"]'
    if (selector.search(/^\[name=("|')([a-zA-z0-9\-_.@=[\] ']+)("|')]$/) >= 0) {
        return 'name'
    }
    // Allow to move up to the parent or select current element
    if (selector === '..' || selector === '.') {
        return 'xpath'
    }
    // Any element with given class, id, or attribute and content
    // e.g. h1.header=Welcome or [data-name=table-row]=Item or #content*=Intro
    if (selector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))) {
        return 'xpath extended'
    }
}
export const findStrategy = function (selector, isW3C, isMobile) {
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
    case 'id': {
        using = 'id'
        value = selector.slice(3)
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
    case '-android datamatcher': {
        using = '-android datamatcher'
        value = JSON.stringify(value)
        break
    }
    case '-android viewmatcher': {
        using = '-android viewmatcher'
        value = JSON.stringify(value)
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
            value = selector.match(/^\[name=("|')([a-zA-z0-9\-_.@=[\] ']+)("|')]$/)[2]
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
        conditions.push(
            partial ? `contains(., "${query}")` : `normalize-space() = "${query}"`
        )
        value = `.//${tag || '*'}[${conditions.join(' and ')}]`
        break
    }
    case '-image': {
        using = '-image'
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
