import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isElementNotFoundAgain, nameNotFoundAgain, notFoundElement, waitedFor } from './utils/elementNotFound.js'
import { isStaleElementError } from './utils/index.js'

export const IMPLICIT_WAIT_EXCLUSION_LIST = ['getElement', 'getElements']

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  command shim
 */
export const elementErrorHandler = (fn: Function) => (commandName: string, commandFn: Function) => {
    return function elementErrorHandlerCallback (this: WebdriverIO.Element, ...args: unknown[]) {
        return fn(commandName, async function elementErrorHandlerCallbackFn (this: WebdriverIO.Element) {
            if (IMPLICIT_WAIT_EXCLUSION_LIST.includes(commandName)) {
                return fn(commandName, commandFn).apply(this, args)
            }

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
            } catch (_err: unknown) {
                const err = _err as Error
                /**
                 * an inner layer of the command did not find the element again: name this command
                 */
                if (isElementNotFoundAgain(err)) {
                    nameNotFoundAgain(err, this, commandName)
                }
                if (err.name === 'element not interactable') {
                    try {
                        await element.waitForClickable()
                        return await fn(commandName, commandFn).apply(this, args)
                    } catch {
                        const elementHTML = await element.getHTML()
                        err.name = 'webdriverio(middleware): element did not become interactable'
                        err.message = `Element ${elementHTML} did not become interactable`
                        err.stack = err.stack ?? Error.captureStackTrace(err) ?? ''
                    }
                }

                /**
                 * The "element wasn't found" error of a wait (an element that was not found again,
                 * or never found) is not a stale element error, also when its message has that text
                 * (a selector like `[data-error="stale element reference"]`). So the outer layers of
                 * a command do not look for an element that an inner layer did not find, and do not
                 * run the command again (9.31.9 did not either).
                 */
                const stale = !waitedFor(err) && (err.name === 'stale element reference' || isStaleElementError(err))
                if (stale) {
                    try {
                        const element = await refetchElement(this, commandName)
                        this.elementId = element.elementId
                        this.parent = element.parent
                        return await fn(commandName, commandFn).apply(this, args)
                    } catch (refetchErr) {
                        /**
                         * The lookup, or a lookup of the command run again, waited `waitforTimeout`
                         * for the element (or a parent) and did not find it: throw its "element
                         * wasn't found" error. The outer layers of the command do not handle it, so
                         * they do not wait for the element again. A lookup records the element that
                         * it did not find: name the error for this command, with the stale element
                         * error of the driver as its cause. An element that the command never found
                         * keeps its plain error.
                         */
                        if (waitedFor(refetchErr)) {
                            if (refetchErr instanceof Error && notFoundElement(refetchErr) !== undefined) {
                                nameNotFoundAgain(refetchErr, this, commandName, err)
                            }
                            throw refetchErr
                        }
                        /**
                         * Any other failure gives the original stale element error instead of
                         * masking it with an unrelated error, and an outer layer can find the
                         * element again (#15627).
                         */
                        if (!(refetchErr instanceof Error) || !isStaleElementError(refetchErr)) {
                            throw err
                        }
                        throw refetchErr
                    }
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
    return wrapCommand(commandName, function (this: WebdriverIO.MultiRemoteBrowser, ...args: unknown[]) {
        // @ts-ignore
        const commandResults = this.instances.map((instanceName: string) => {
            // @ts-ignore ToDo(Christian)
            return this[instanceName][commandName](...args)
        })

        return Promise.all(commandResults)
    })
}
