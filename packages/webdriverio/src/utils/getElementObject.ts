import { webdriverMonad, wrapCommand, runFnInFiberContext } from '@wdio/utils'
import clone from 'lodash.clonedeep'
import type { ElementReference } from 'webdriver'

import { getBrowserObject, getPrototype as getWDIOPrototype, getElementFromResponse } from '.'
import { elementErrorHandler } from '../middlewares'
import { ELEMENT_KEY } from '../constants'
import type { ElementObject, Selector, BrowserObject, Element, ElementArray } from '../types'

/**
 * transforms a findElement response into a WDIO element
 * @param  {String} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export const getElement = function findElement(
    this: BrowserObject | Element,
    selector?: Selector,
    res?: ElementReference | Error,
    isReactElement = false
): Element {
    const browser = getBrowserObject(this)
    const propertiesObject = {
        ...clone(browser.__propertiesObject__),
        ...getWDIOPrototype('element'),
        scope: { value: 'element' }
    }

    const element = webdriverMonad(this.options, (client: ElementObject) => {
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
        client.isReactElement = isReactElement

        return client
    }, propertiesObject)

    const elementInstance = element(this.sessionId, elementErrorHandler(wrapCommand))

    const origAddCommand = elementInstance.addCommand.bind(elementInstance)
    elementInstance.addCommand = (name: string, fn: Function) => {
        browser.__propertiesObject__[name] = { value: fn }
        origAddCommand(name, runFnInFiberContext(fn))
    }

    return elementInstance
}

/**
 * transforms a findElements response into an array of WDIO elements
 * @param  {String} selector  selector that was used to query the element
 * @param  {Object} res       findElements response
 * @return {Array}            array of WDIO elements
 */
export const getElements = function getElements(
    this: BrowserObject | Element,
    selector: Selector,
    elemResponse: ElementReference[],
    isReactElement = false
): ElementArray {
    const browser = getBrowserObject(this as Element)
    const propertiesObject = {
        ...clone(browser.__propertiesObject__),
        ...getWDIOPrototype('element')
    }

    const elements = elemResponse.map((res: ElementReference | Error, i) => {
        propertiesObject.scope = { value: 'element' }
        const element = webdriverMonad(this.options, (client: ElementObject) => {
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
                client.error = res as Error
            }

            client.selector = selector
            client.parent = this
            client.index = i
            client.emit = this.emit.bind(this)
            client.isReactElement = isReactElement

            return client
        }, propertiesObject)

        const elementInstance = element(this.sessionId, elementErrorHandler(wrapCommand))

        const origAddCommand = elementInstance.addCommand.bind(elementInstance)
        elementInstance.addCommand = (name: string, fn: Function) => {
            browser.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, runFnInFiberContext(fn))
        }
        return elementInstance
    })

    return elements as ElementArray
}
