import fs from 'node:fs'
import isPlainObject from 'lodash.isplainobject'
import { roleElements, ARIARoleDefintionKey, ARIARoleRelationConcept, ARIARoleRelationConceptAttribute } from 'aria-query'

import { W3C_SELECTOR_STRATEGIES, DEEP_SELECTOR } from '../constants.js'

const DEFAULT_STRATEGY = 'css selector'
const DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-android datamatcher|-android viewmatcher|-android viewtag|-ios uiautomation|-ios predicate string|-ios class chain|accessibility id):(.+)/
const XPATH_SELECTORS_START = [
    '/', '(', '../', './', '*/'
]
const NAME_MOBILE_SELECTORS_START = [
    'uia', 'xcuielementtype', 'android.widget', 'cyi', 'android.view'
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

type SelectorStrategy = string | { name: string, args: string }

const defineStrategy = function (selector: SelectorStrategy) {
    // Condition with checking isPlainObject(selector) should be first because
    // in case of "selector" argument is a plain object then .match() will cause
    // an error like "selector.match is not a function"
    // Use '-android datamatcher' or '-android viewmatcher' strategy if selector is a plain object (Android only)
    if (isPlainObject(selector)) {
        if (JSON.stringify(selector).indexOf('test.espresso.matcher.ViewMatchers') < 0)
            return '-android datamatcher'
        return '-android viewmatcher'
    }

    const stringSelector = selector as string
    // Check if user has specified locator strategy directly
    if (stringSelector.match(DIRECT_SELECTOR_REGEXP)) {
        return 'directly'
    }
    // Use appium image strategy if selector ends with certain text(.jpg,.gif..)
    if (IMAGEPATH_MOBILE_SELECTORS_ENDSWITH.some(path => {
        const selector = stringSelector.toLowerCase()
        return selector.endsWith(path) && selector !== path
    })) {
        return '-image'
    }
    // Use xPath strategy if selector starts with //
    if (XPATH_SELECTORS_START.some(option => stringSelector.startsWith(option))) {
        return 'xpath'
    }
    // Use link text strategy if selector starts with =
    if (stringSelector.startsWith('=')) {
        return 'link text'
    }
    // Use partial link text strategy if selector starts with *=
    if (stringSelector.startsWith('*=')) {
        return 'partial link text'
    }
    // Use id strategy if the selector starts with id=
    if (stringSelector.startsWith('id=')) {
        return 'id'
    }
    // use shadow dom selector
    if (stringSelector.startsWith(DEEP_SELECTOR)) {
        return 'shadow'
    }
    // Recursive element search using the UiAutomator library (Android only)
    if (stringSelector.startsWith('android=')) {
        return '-android uiautomator'
    }
    // Recursive element search using the UIAutomation library (iOS-only)
    if (stringSelector.startsWith('ios=')) {
        return '-ios uiautomation'
    }
    // Recursive element search using accessibility id
    if (stringSelector.startsWith('~')) {
        return 'accessibility id'
    }
    // Class name mobile selector
    // for iOS = UIA...
    // for Android = android.widget
    if (NAME_MOBILE_SELECTORS_START.some(option => stringSelector.toLowerCase().startsWith(option))) {
        return 'class name'
    }
    // Use tag name strategy if selector contains a tag
    // e.g. "<div>" or "<div />"
    if (stringSelector.search(/<[0-9a-zA-Z-]+( \/)*>/g) >= 0) {
        return 'tag name'
    }
    // Use name strategy if selector queries elements with name attributes for JSONWP
    // or if isMobile is used even when w3c is used
    // e.g. "[name='myName']" or '[name="myName"]'
    if (stringSelector.search(/^\[name=("|')([a-zA-z0-9\-_.@=[\] ']+)("|')]$/) >= 0) {
        return 'name'
    }
    // Allow to move up to the parent or select current element
    if (selector === '..' || selector === '.') {
        return 'xpath'
    }
    // Any element with given class, id, or attribute and content
    // e.g. h1.header=Welcome or [data-name=table-row]=Item or #content*=Intro
    if (stringSelector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))) {
        return 'xpath extended'
    }
    if (stringSelector.match(/^\[role=[A-Za-z]+]$/)){
        return 'role'
    }
}
export const findStrategy = function (selector: SelectorStrategy, isW3C?: boolean, isMobile?: boolean) {
    const stringSelector = selector as string
    let using: string = DEFAULT_STRATEGY
    let value = selector as string

    switch (defineStrategy(selector)) {
    // user has specified locator strategy directly
    case 'directly': {
        const match = stringSelector.match(DIRECT_SELECTOR_REGEXP)
        if (!match || !isMobile && isW3C && !W3C_SELECTOR_STRATEGIES.includes(match[1])) {
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
        value = stringSelector.slice(3)
        break
    }
    case 'link text': {
        using = 'link text'
        value = stringSelector.slice(1)
        break
    }
    case 'partial link text': {
        using = 'partial link text'
        value = stringSelector.slice(2)
        break
    }
    case 'shadow':
        using = 'shadow'
        value = stringSelector.slice(DEEP_SELECTOR.length)
        break
    case '-android uiautomator': {
        using = '-android uiautomator'
        value = stringSelector.slice(8)
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
        value = stringSelector.slice(4)
        break
    }
    case 'accessibility id': {
        using = 'accessibility id'
        value = stringSelector.slice(1)
        break
    }
    case 'class name': {
        using = 'class name'
        break
    }
    case 'tag name': {
        using = 'tag name'
        value = stringSelector.replace(/<|>|\/|\s/g, '')
        break
    }
    case 'name': {
        if (isMobile || !isW3C) {
            const match = stringSelector.match(/^\[name=("|')([a-zA-z0-9\-_.@=[\] ']+)("|')]$/)
            if (!match) {
                throw new Error(`InvalidSelectorMatch. Strategy 'name' has failed to match '${stringSelector}'`)
            }
            using = 'name'
            value = match[2]
        }
        break
    }
    case 'xpath extended': {
        using = 'xpath'
        const match = stringSelector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))
        if (!match) {
            throw new Error(`InvalidSelectorMatch: Strategy 'xpath extended' has failed to match '${stringSelector}'`)
        }
        const PREFIX_NAME: Record<string, string> = { '.': 'class', '#': 'id' }
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
        value = fs.readFileSync(stringSelector, { encoding: 'base64' })
        break
    }
    case 'role': {
        const match = stringSelector.match(/^\[role=(.+)\]/)
        if (!match) {
            throw new Error(`InvalidSelectorMatch. Strategy 'role' has failed to match '${stringSelector}'`)
        }
        using = 'css selector'
        value = createRoleBaseXpathSelector(match[1] as ARIARoleDefintionKey)
        break
    }
    }

    return { using, value }
}

const createRoleBaseXpathSelector = (role: ARIARoleDefintionKey) => {
    const locatorArr: string[] = []
    roleElements.get(role)?.forEach((value: ARIARoleRelationConcept) => {
        let locator: string
        let tagname: string, tagAttribute: string | undefined, tagAttributevalue: string | number | undefined
        tagname = value.name
        if (value.attributes instanceof Array) {
            value.attributes.forEach((val: ARIARoleRelationConceptAttribute) => {
                tagAttribute = val.name
                tagAttributevalue = val.value
            })
        }
        if (!tagAttribute) {
            locator = tagname
        } else if (!tagAttributevalue){
            locator = `${tagname}[${tagAttribute}]`
        } else {
            locator = `${tagname}[${tagAttribute}="${tagAttributevalue}"]`
        }
        locatorArr.push(locator)
    })
    let xpathLocator: string = `[role="${role}"]`
    locatorArr.forEach((loc) => {
        xpathLocator += ',' + loc
    })
    return xpathLocator
}
