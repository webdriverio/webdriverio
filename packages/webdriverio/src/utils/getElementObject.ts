import { webdriverMonad, wrapCommand } from '@wdio/utils'
import clone from 'lodash.clonedeep'
import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'

import { getPrototype as getWDIOPrototype, getElementFromResponse } from './index.js'
import { elementErrorHandler } from '../middlewares.js'
import * as browserCommands from '../commands/browser.js'
import type { Selector, AddCommandFn, ExtendedElementReference } from '../types.js'

interface GetElementProps {
    isReactElement?: boolean
    isShadowElement?: boolean
}

interface WebDriverErrorResponse {
    error: string,
    message: string
    stacktrace: string,
}

class WebDriverError extends Error {
    constructor(obj: Error | WebDriverErrorResponse) {

        const { name, stack } = obj as Error
        const { error, stacktrace } = obj as WebDriverErrorResponse

        super(error || name || '')
        Object.assign(this, {
            message: obj.message,
            stack: stacktrace || stack,
        })
    }
}

/**
 * transforms a findElement response into a WDIO element
 * @param  {string} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export function getElement(
    this: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext,
    selector?: Selector,
    res?: ElementReference | ExtendedElementReference | Error,
    props: GetElementProps = { isReactElement: false, isShadowElement: false }
): WebdriverIO.Element {
    const browser = getBrowserObject(this)
    const browserCommandKeys = Object.keys(browserCommands)
    const propertiesObject: PropertyDescriptorMap = {
        /**
         * filter out browser commands from object
         */
        ...(Object.entries(clone(browser.__propertiesObject__)).reduce((commands, [name, descriptor]) => {
            if (!browserCommandKeys.includes(name)) {
                commands[name] = descriptor
            }
            return commands
        }, {} as Record<string, PropertyDescriptor>)),
        ...getWDIOPrototype('element'),
        scope: { value: 'element' }
    }

    propertiesObject.emit = { value: browser.emit.bind(browser) }
    const element = webdriverMonad(browser.options, (client: WebdriverIO.Element) => {
        const elementId = getElementFromResponse(res as ElementReference)

        if (elementId) {
            /**
             * set elementId for easy access
             */
            client.elementId = elementId

            /**
             * set element id with proper key so element can be passed into execute commands
             */
            client[ELEMENT_KEY] = elementId

            /**
             * Attach locator if element was fetched with WebDriver Bidi.
             * This allows to later re-fetch the element within the same conditions.
             */
            if (res && browser.isBidi && 'locator' in res) {
                client.locator = res.locator
            }
        } else {
            client.error = res as Error
        }

        if (selector) {
            client.selector = selector
        }
        client.parent = this
        client.isReactElement = props.isReactElement
        client.isShadowElement = props.isShadowElement

        return client
    }, propertiesObject)

    const elementInstance = element(browser.sessionId as string, elementErrorHandler(wrapCommand))

    const origAddCommand = elementInstance.addCommand.bind(elementInstance)
    elementInstance.addCommand = (name: string, fn: Function) => {
        browser.__propertiesObject__[name] = { value: fn }
        origAddCommand(name, fn)
    }

    return elementInstance
}

/**
 * transforms a findElements response into an array of WDIO elements
 * @param  {string} selector  selector that was used to query the element
 * @param  {Object} res       findElements response
 * @return {Array}            array of WDIO elements
 */
export const getElements = function getElements(
    this: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext,
    selector: Selector | ElementReference[] | WebdriverIO.Element[],
    elemResponse: (ElementReference | ExtendedElementReference | Error | WebDriverError)[],
    props: GetElementProps = { isReactElement: false, isShadowElement: false }
): WebdriverIO.Element[] {
    const browser = getBrowserObject(this as WebdriverIO.Element)
    const browserCommandKeys = Object.keys(browserCommands)
    const propertiesObject: PropertyDescriptorMap = {
        /**
         * filter out browser commands from object
         */
        ...(Object.entries(clone(browser.__propertiesObject__)).reduce((commands, [name, descriptor]) => {
            if (!browserCommandKeys.includes(name)) {
                commands[name] = descriptor
            }
            return commands
        }, {} as Record<string, PropertyDescriptor>)),
        ...getWDIOPrototype('element')
    }

    if (elemResponse.length === 0) {
        return []
    }

    const elements = [elemResponse].flat(1).map((res: ElementReference | ExtendedElementReference | Element | Error | WebDriverError, i) => {
        /**
         * if we already deal with an element, just return it
         */
        if ((res as WebdriverIO.Element).selector && '$$' in res) {
            return res as WebdriverIO.Element
        }

        propertiesObject.scope = { value: 'element' }
        propertiesObject.emit = { value: browser.emit.bind(browser) }
        const element = webdriverMonad(browser.options, (client: WebdriverIO.Element) => {
            const elementId = getElementFromResponse(res as ElementReference)

            if (elementId) {
                /**
                 * set elementId for easy access
                 */
                client.elementId = elementId

                /**
                 * set element id with proper key so element can be passed into execute commands
                 */
                client[ELEMENT_KEY] = elementId

                /**
                 * Attach locator if element was fetched with WebDriver Bidi.
                 * This allows to later re-fetch the element within the same conditions.
                 */
                if (res && browser.isBidi && 'locator' in res) {
                    client.locator = res.locator
                }
            } else {
                res = res as WebDriverError | Error
                client.error = res instanceof Error ? res : new WebDriverError(res)
            }

            client.selector = Array.isArray(selector)
                ? (selector[i] as WebdriverIO.Element).selector
                : selector
            client.parent = this
            client.index = i
            client.isReactElement = props.isReactElement
            client.isShadowElement = props.isShadowElement

            return client
        }, propertiesObject)

        const elementInstance: WebdriverIO.Element = element((this as WebdriverIO.Browser).sessionId, elementErrorHandler(wrapCommand))

        const origAddCommand = elementInstance.addCommand.bind(elementInstance)
        elementInstance.addCommand = (name: string, fn: AddCommandFn) => {
            browser.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, fn)
        }
        return elementInstance
    })

    return elements
}
