import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isStaleElementError } from './utils/index.js'

export const IMPLICIT_WAIT_EXCLUSION_LIST = ['getElement', 'getElements', 'emit']

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

                if (err.name === 'stale element reference' || isStaleElementError(err)) {
                    try {
                        const element = await refetchElement(this, commandName)
                        this.elementId = element.elementId
                        this.parent = element.parent
                        return await fn(commandName, commandFn).apply(this, args)
                    } catch (refetchErr) {
                        /**
                         * If refetch fails (e.g., page navigated away and elements
                         * are no longer found), re-throw the original stale element
                         * error instead of masking it with "Index out of bounds"
                         * or other refetch errors.
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
 * handle single command calls from multi-remote instances
 */
export const multiRemoteHandler = (
    wrapCommand: Function
) => (commandName: keyof WebdriverIO.Browser) => {
    return wrapCommand(commandName, function (this: WebdriverIO.MultiRemoteBrowser, ...args: unknown[]) {
        const commandResults = this.instances.map((instanceName: string) => {
            const instance = this.getInstance(instanceName)
            if (!instance) {
                throw new Error(`Multi-remote object has no instance named "${instanceName}"`)
            }
            const command = (instance as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[commandName as unknown as string]
            return command.call(instance, ...args)
        })

        return Promise.all(commandResults)
    })
}
