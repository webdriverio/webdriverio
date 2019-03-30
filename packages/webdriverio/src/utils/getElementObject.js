import { webdriverMonad } from 'webdriver'
import { wrapCommand, runFnInFiberContext } from '@wdio/config'
import merge from 'lodash.merge'

import { getBrowserObject, getPrototype as getWDIOPrototype, getElementFromResponse } from '../utils'
import { elementErrorHandler } from '../middlewares'
import { ELEMENT_KEY } from '../constants'

/**
 * transforms and findElement response into a WDIO element
 * @param  {String} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export const getElement = function findElement (selector, res) {
    const browser = getBrowserObject(this)
    const prototype = merge({}, browser.__propertiesObject__, getWDIOPrototype('element'), { scope: 'element' })

    const element = webdriverMonad(this.options, (client) => {
        const elementId = getElementFromResponse(res)

        if (elementId) {
            /**
             * set elementId for easy access
             */
            client.elementId = elementId

            /**
             * set element id with proper key so element can be passed into execute commands
             */
            if (this.isW3C) {
                client[ELEMENT_KEY] = elementId
            } else {
                client.ELEMENT = elementId
            }
        } else {
            client.error = res
        }

        client.selector = selector
        client.parent = this
        client.emit = ::this.emit
        return client
    }, prototype)

    const elementInstance = element(this.sessionId, elementErrorHandler(wrapCommand))

    const origAddCommand = ::elementInstance.addCommand
    elementInstance.addCommand = (name, fn) => {
        browser.__propertiesObject__[name] = { value: fn }
        origAddCommand(name, runFnInFiberContext(fn))
    }
    return elementInstance
}

/**
 * transforms and findElement response into a WDIO element
 * @param  {String} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export const getElements = function getElements (selector, res) {
    const browser = getBrowserObject(this)
    const prototype = merge({}, browser.__propertiesObject__, getWDIOPrototype('element'), { scope: 'element' })

    const elements = res.map((res, i) => {
        const element = webdriverMonad(this.options, (client) => {
            const elementId = getElementFromResponse(res)

            if (elementId) {
                /**
                 * set elementId for easy access
                 */
                client.elementId = elementId

                /**
                 * set element id with proper key so element can be passed into execute commands
                 */
                if (this.isW3C) {
                    client[ELEMENT_KEY] = elementId
                } else {
                    client.ELEMENT = elementId
                }
            } else {
                client.error = res
            }

            client.selector = selector
            client.parent = this
            client.index = i
            client.emit = ::this.emit
            return client
        }, prototype)

        const elementInstance = element(this.sessionId, elementErrorHandler(wrapCommand))

        const origAddCommand = ::elementInstance.addCommand
        elementInstance.addCommand = (name, fn) => {
            browser.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, runFnInFiberContext(fn))
        }
        return elementInstance
    })

    return elements
}
