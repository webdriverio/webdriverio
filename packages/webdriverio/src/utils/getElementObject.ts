import { webdriverMonad, wrapCommand } from '@wdio/utils'
import clone from 'lodash.clonedeep'
import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { getBrowserObject, getPrototype as getWDIOPrototype, getElementFromResponse } from './index.js'
import { elementErrorHandler } from '../middlewares.js'
import * as browserCommands from '../commands/browser.js'
import type { Selector, AddCommandFn } from '../types.js'

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
export const getElement = function findElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector?: Selector,
    res?: ElementReference | Error,
    props: GetElementProps = { isReactElement: false, isShadowElement: false }
): WebdriverIO.Element {
    const browser = getBrowserObject(this)
    const browserCommandKeys = Object.keys(browserCommands)
    const propertiesObject = {
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

    const element = webdriverMonad(this.options, (client: WebdriverIO.Element) => {
        const elementId = getElementFromResponse(res as ElementReference)

        if (elementId) {
            /**
             * set elementId for easy access
             */
            client.elementId = elementId

            /**
             * set element id with proper key so element can be passed into execute commands
             */
            if (this.isW3C) {
                (client as any)[ELEMENT_KEY] = elementId
            } else {
                client.ELEMENT = elementId
            }
        } else {
            client.error = res as Error
        }

        client.selector = selector || ''
        client.parent = this
        client.emit = this.emit.bind(this)
        client.isReactElement = props.isReactElement
        client.isShadowElement = props.isShadowElement

        return client
    }, propertiesObject)

    const elementInstance = element(this.sessionId as string, elementErrorHandler(wrapCommand))

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
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[],
    elemResponse: (ElementReference | Error | WebDriverError)[],
    props: GetElementProps = { isReactElement: false, isShadowElement: false }
): WebdriverIO.Element[] {
    const browser = getBrowserObject(this as WebdriverIO.Element)
    const browserCommandKeys = Object.keys(browserCommands)
    const propertiesObject = {
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

    const elements = [elemResponse].flat(1).map((res: ElementReference | Element | Error | WebDriverError, i) => {
        /**
         * if we already deal with an element, just return it
         */
        if ((res as WebdriverIO.Element).selector) {
            return res as WebdriverIO.Element
        }

        propertiesObject.scope = { value: 'element' }
        const element = webdriverMonad(this.options, (client: WebdriverIO.Element) => {
            const elementId = getElementFromResponse(res as ElementReference)

            if (elementId) {
                /**
                 * set elementId for easy access
                 */
                client.elementId = elementId

                /**
                 * set element id with proper key so element can be passed into execute commands
                 */
                const elementKey = this.isW3C ? ELEMENT_KEY : 'ELEMENT'
                client[elementKey] = elementId
            } else {
                res = res as WebDriverError | Error
                client.error = res instanceof Error ? res : new WebDriverError(res)
            }

            client.selector = Array.isArray(selector)
                ? (selector[i] as WebdriverIO.Element).selector
                : selector
            client.parent = this
            client.index = i
            client.emit = this.emit.bind(this)
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
