import type { ARIARoleDefinitionKey, ARIARoleRelationConcept, ARIARoleRelationConceptAttribute } from 'aria-query'
import { roleElements } from 'aria-query'

import { environment } from '../environment.js'
import { DEEP_SELECTOR, ARIA_SELECTOR, ROLE_SELECTOR } from '../constants.js'
import { knownRoles, ROLE_SYNONYMS } from '@wdio/utils'

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
    /(?:\[(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?:=(?:"|')([a-zA-Z0-9\-_. ]+)(?:"|'))?\])?/,
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
    if (DIRECT_SELECTOR_REGEXP.test(stringSelector)) {
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
    // use role selector, e.g. role/button[name="Add to cart"]
    if (stringSelector.startsWith(ROLE_SELECTOR)) {
        return 'role selector'
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
    // Mobile sessions use the name strategy for [name="..."] selectors.
    // Desktop sessions keep them on the css strategy.
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
    if (/^\[role=[A-Za-z]+]$/.test(stringSelector)){
        return 'role'
    }
}
/**
 * Quote a string as an XPath 1.0 literal so user-provided labels cannot
 * break out of the surrounding quotes.
 */
export function escapeXPathString(value: string) {
    if (!value.includes('"')) {
        return `"${value}"`
    }
    if (!value.includes("'")) {
        return `'${value}'`
    }

    const parts: string[] = []
    for (const segment of value.split('"')) {
        if (segment.length > 0) {
            parts.push(`"${segment}"`)
        }
        parts.push('\'"\'')
    }
    parts.pop()
    return `concat(${parts.join(', ')})`
}

/**
 * XPath approximation of an accessible name lookup.
 * Used for WebDriver Classic sessions and as a fallback when BiDi
 * accessibility locators are unavailable.
 */
export function getAriaXPathSelector(label: string) {
    const escaped = escapeXPathString(label)
    /**
     * A path inside a predicate that starts at the document root is evaluated
     * again for every node the outer path visits, so `.//*[@a = (//*[…]/@id)]`
     * scans the document once per element: minutes on a large page, during
     * which the page can't run anything else. `id()` looks the referenced
     * elements up instead, and the attribute test first keeps the outer set small.
     */
    const conditions = [
        // aria label is recevied by other element with aria-labelledBy
        // https://www.w3.org/TR/accname-1.1/#step2B
        `.//*[@aria-labelledby][id(@aria-labelledby)[normalize-space(text()) = ${escaped}]]`,
        // aria label is recevied by other element with aria-labelledBy
        // https://www.w3.org/TR/accname-1.1/#step2B
        `.//*[@aria-describedby][id(@aria-describedby)[normalize-space(text()) = ${escaped}]]`,
        // element has direct aria label
        // https://www.w3.org/TR/accname-1.1/#step2C
        `.//*[@aria-label = ${escaped}]`,
        // input and textarea with a label
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//input[@id][@id = (//label[normalize-space() = ${escaped}]/@for)]`,
        `.//textarea[@id][@id = (//label[normalize-space() = ${escaped}]/@for)]`,
        // input and textarea with a label as parent
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//input[ancestor::label[normalize-space(text()) = ${escaped}]]`,
        `.//textarea[ancestor::label[normalize-space(text()) = ${escaped}]]`,
        // aria label is received by a placeholder
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//input[@placeholder=${escaped}]`,
        `.//textarea[@placeholder=${escaped}]`,
        // aria label is received by a aria-placeholder
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//input[@aria-placeholder=${escaped}]`,
        `.//textarea[@aria-placeholder=${escaped}]`,
        // aria label is received by a title
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//*[not(self::label)][@title=${escaped}]`,
        // images with an alt tag
        // https://www.w3.org/TR/accname-1.1/#step2D
        `.//img[@alt=${escaped}]`,
        // aria label is received from element text content
        // https://www.w3.org/TR/accname-1.1/#step2G
        `.//*[not(self::label)][normalize-space(text()) = ${escaped}]`
    ]
    return conditions.join(' | ')
}

export interface RoleSelector {
    role: string
    name?: string
}

const ROLE_SELECTOR_REGEXP = /^role\/([a-zA-Z]+)(?:\[name=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\])?$/

function editDistance (a: string, b: string) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0]
        row[0] = i
        for (let j = 1; j <= b.length; j++) {
            const current = row[j]
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
            previous = current
        }
    }
    return row[b.length]
}

/**
 * Parse `role/<role>` or `role/<role>[name="<accessible name>"]`. Quotes
 * inside the name are escaped with a backslash.
 */
export function parseRoleSelector (selector: string): RoleSelector {
    const match = selector.match(ROLE_SELECTOR_REGEXP)
    if (!match) {
        throw new Error(
            `InvalidSelectorMatch. Strategy 'role' has failed to match '${selector}'. ` +
            'Expected `role/<role>` or `role/<role>[name="<accessible name>"]`.'
        )
    }
    const role = match[1]
    const roles = knownRoles()
    if (!roles.includes(role)) {
        const closest = roles.reduce((best, candidate) => editDistance(role, candidate) < editDistance(role, best) ? candidate : best)
        throw new Error(
            `InvalidSelectorMatch. Strategy 'role' has failed to match '${selector}': ` +
            `"${role}" is not an ARIA role. Did you mean "${closest}"?`
        )
    }
    const canonicalRole = ROLE_SYNONYMS[role] || role
    const rawName = match[2] ?? match[3]
    return rawName === undefined
        ? { role: canonicalRole }
        : { role: canonicalRole, name: rawName.replace(/\\(.)/g, '$1') }
}

export const findStrategy = function (
    selector: SelectorStrategy,
    isMobile?: boolean,
    isBidi?: boolean
) {
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
    case 'role selector': {
        using = 'role'
        value = JSON.stringify(parseRoleSelector(stringSelector))
        break
    }
    case 'aria': {
        const label = stringSelector.slice(ARIA_SELECTOR.length)
        if (isBidi) {
            /**
             * Use the native BiDi accessibility locator. This queries the
             * browser accessibility tree by accessible name and avoids the
             * expensive XPath union that WebDriver Classic has to run.
             */
            using = 'aria'
            value = label
        } else {
            using = 'xpath'
            value = getAriaXPathSelector(label)
        }
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
        if (isMobile) {
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
        const match = stringSelector.match(new RegExp(XPATH_SELECTOR_REGEXP.map(rx => rx.source).join('')))
        if (!match) {
            throw new Error(`InvalidSelectorMatch: Strategy 'xpath extended' has failed to match '${stringSelector}'`)
        }
        const PREFIX_NAME: Record<string, string> = { '.': 'class', '#': 'id' }
        const conditions: Array<string> = []
        const [
            tag,
            prefix, name,
            attrName, attrValue,
            insensitive,
            partial, query
        ] = match.slice(1)

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
        value = environment.value.readFileSync(stringSelector, { encoding: 'base64' })
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
