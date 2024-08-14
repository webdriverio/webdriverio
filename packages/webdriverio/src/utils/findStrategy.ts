import fs from 'node:fs'
import type { ARIARoleDefinitionKey, ARIARoleRelationConcept, ARIARoleRelationConceptAttribute } from 'aria-query'
import { roleElements } from 'aria-query'

import { DEEP_SELECTOR, ARIA_SELECTOR } from '../constants.js'

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
    // optional case insensitive
    /(\.)?/,
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
    if (typeof selector === 'object') {
        if (JSON.stringify(selector).indexOf('test.espresso.matcher.ViewMatchers') < 0) {
            return '-android datamatcher'
        }
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
    // use aria selector
    if (stringSelector.startsWith(ARIA_SELECTOR)) {
        return 'aria'
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
    if (stringSelector.search(/^\[name=(?:"(.[^"]*)"|'(.[^']*)')]$/) >= 0) {
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
        if (!match) {
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
    case 'aria': {
        const label = stringSelector.slice(ARIA_SELECTOR.length)
        const conditions = [
            // aria label is recevied by other element with aria-labelledBy
            // https://www.w3.org/TR/accname-1.1/#step2B
            `.//*[@aria-labelledby=(//*[normalize-space(text()) = "${label}"]/@id)]`,
            // aria label is recevied by other element with aria-labelledBy
            // https://www.w3.org/TR/accname-1.1/#step2B
            `.//*[@aria-describedby=(//*[normalize-space(text()) = "${label}"]/@id)]`,
            // element has direct aria label
            // https://www.w3.org/TR/accname-1.1/#step2C
            `.//*[@aria-label = "${label}"]`,
            // input and textarea with a label
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//input[@id = (//label[normalize-space() = "${label}"]/@for)]`,
            `.//textarea[@id = (//label[normalize-space() = "${label}"]/@for)]`,
            // input and textarea with a label as parent
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//input[ancestor::label[normalize-space(text()) = "${label}"]]`,
            `.//textarea[ancestor::label[normalize-space(text()) = "${label}"]]`,
            // aria label is received by a placeholder
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//input[@placeholder="${label}"]`,
            `.//textarea[@placeholder="${label}"]`,
            // aria label is received by a aria-placeholder
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//input[@aria-placeholder="${label}"]`,
            `.//textarea[@aria-placeholder="${label}"]`,
            // aria label is received by a title
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//*[not(self::label)][@title="${label}"]`,
            // images with an alt tag
            // https://www.w3.org/TR/accname-1.1/#step2D
            `.//img[@alt="${label}"]`,
            // aria label is received from element text content
            // https://www.w3.org/TR/accname-1.1/#step2G
            `.//*[not(self::label)][normalize-space(text()) = "${label}"]`
        ]
        using = 'xpath'
        value = conditions.join(' | ')
        break
    }
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
            const match = stringSelector.match(/^\[name=(?:"(.[^"]*)"|'(.[^']*)')]$/)
            if (!match) {
                throw new Error(`InvalidSelectorMatch. Strategy 'name' has failed to match '${stringSelector}'`)
            }
            using = 'name'
            value = match[1] || match[2]
        }
        break
    }
    case 'xpath extended': {
        using = 'xpath'
        const PREFIX_NAME: Record<string, string> = { '.': 'class', '#': 'id' }
        const conditions: Array<string> = []
        const { tag, prefix, name, attrName, attrValue, insensitive, partial, query } = parseExtendedXPathSelector(stringSelector)

        if (prefix) {
            if (prefix === '.') {
                // trick to match a class name exactly
                conditions.push(`contains(concat(" ",@${PREFIX_NAME[prefix]}," "), " ${name} ")`)
            } else {
                conditions.push(`contains(@${PREFIX_NAME[prefix]}, "${name}")`)
            }
        }
        if (attrName) {
            conditions.push(
                attrValue
                    ? `contains(@${attrName}, "${attrValue}")`
                    : `@${attrName}`
            )
        }
        const partialNot = ` and not(${`.//${tag || '*'}${conditions.length ? `[${conditions.join(' and ')}]` : ''}`})`
        if (insensitive) {
            conditions.push(
                partial
                    ? `contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "${query.toLowerCase()}")${partialNot}`
                    : `normalize-space(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")) = "${query.toLowerCase()}"`)
        } else {
            conditions.push(partial ? `contains(., "${query}")${partialNot}` : `normalize-space(text()) = "${query}"`)
        }
        const getValue = () => `.//${tag || '*'}[${conditions.join(' and ')}]`
        value = getValue()
        if (!partial) {
            conditions.pop()
            conditions.push(
                `not(${value})`,
                `normalize-space() = "${insensitive? query.toLowerCase() : query}"`
            )
            value = value + ' | ' + getValue()
        }
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
        value = createRoleBaseXpathSelector(match[1] as ARIARoleDefinitionKey)
        break
    }
    }

    return { using, value }
}

const createRoleBaseXpathSelector = (role: ARIARoleDefinitionKey) => {
    const locatorArr: string[] = []
    roleElements.get(role)?.forEach((value: ARIARoleRelationConcept) => {
        let locator: string
        let tagAttribute: string | undefined, tagAttributevalue: string | number | undefined
        const tagname: string = value.name
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

export function isExtendedXPathSelector (selector: string) {
    return Boolean(selector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join(''))))
}

export function parseExtendedXPathSelector (selector: string) {
    const match = selector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))
    if (!match) {
        throw new Error(`InvalidSelectorMatch: Strategy 'xpath extended' has failed to match '${selector}'`)
    }
    const [
        tag,
        prefix, name,
        attrName, attrValue,
        insensitive,
        partial, query
    ] = match.slice(1)
    return { tag, prefix, name, attrName, attrValue, insensitive, partial, query }
}
