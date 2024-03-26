import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isStaleElementError } from './utils/index.js'

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  command shim
 */
export const elementErrorHandler = (fn: Function) => (commandName: string, commandFn: Function) => {
    return function elementErrorHandlerCallback (this: WebdriverIO.Element, ...args: any[]) {
        return fn(commandName, async function elementErrorHandlerCallbackFn (this: WebdriverIO.Element) {
            const element = await implicitWait(this, commandName)
            this.elementId = element.elementId
            this[ELEMENT_KEY] = element.elementId

            try {
                const result = await fn(commandName, commandFn).apply(this, args)

                /**
                 * assume Safari responses like { error: 'no such element', message: '', stacktrace: '' }
                 * as `stale element reference`
                 */
                const caps = getBrowserObject(this).capabilities as WebdriverIO.Capabilities
                if (caps?.browserName === 'safari' && result?.error === 'no such element') {
                    const errorName = 'stale element reference'
                    const err = new Error(errorName)
                    err.name = errorName
                    throw err
                }

                return result
            } catch (err: any) {
                if (err.name === 'element not interactable') {
                    const elementHTML = await element.getHTML()
                    err.message = `Element ${elementHTML} not interactable`
                    err.stack = err.stack ?? Error.captureStackTrace(err)
                }

                if (err.name === 'stale element reference' || isStaleElementError(err)) {
                    const element = await refetchElement(this, commandName)
                    this.elementId = element.elementId
                    this.parent = element.parent
                    return await fn(commandName, commandFn).apply(this, args)
                }

                throw err
            }
        }).apply(this)

    }
}

/**
 * handle single command calls from multiremote instances
 */
export const multiremoteHandler = (
    wrapCommand: Function
) => (commandName: keyof WebdriverIO.Browser) => {
    return wrapCommand(commandName, function (this: WebdriverIO.MultiRemoteBrowser, ...args: any[]) {
        // @ts-ignore
        const commandResults = this.instances.map((instanceName: string) => {
            // @ts-ignore ToDo(Christian)
            return this[instanceName][commandName](...args)
        })

        return Promise.all(commandResults)
    })
}
