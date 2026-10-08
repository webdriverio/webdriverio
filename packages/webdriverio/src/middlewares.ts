import { ELEMENT_KEY } from 'webdriver'
import { ELEMENT_ARRAY_COMMANDS, ELEMENT_ARRAY_WRAP, getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isStaleElementError } from './utils/index.js'
/**
 * imported from the leaf module directly, see `utils/implicitWait.ts`
 */
import { StrictSelectorError } from './utils/strictSelectorError.js'

export const IMPLICIT_WAIT_EXCLUSION_LIST = ['getElement', 'getElements', 'emit']

/**
 * Run an element command after the implicit wait, and retry it when the element
 * is stale or not yet interactable. `execute` is the command itself, without
 * this wrapper, so a retry does not wait a second time.
 */
async function invokeElementCommand (
    element: WebdriverIO.Element,
    commandName: string,
    execute: () => Promise<unknown>
): Promise<unknown> {
    if (IMPLICIT_WAIT_EXCLUSION_LIST.includes(commandName)) {
        return execute()
    }

    const fetched = await implicitWait(element, commandName)
    element.elementId = fetched.elementId
    element[ELEMENT_KEY] = fetched.elementId

    try {
        const result = await execute()

        /**
         * assume Safari responses like { error: 'no such element', message: '', stacktrace: '' }
         * as `stale element reference`
         */
        const caps = getBrowserObject(element).capabilities as WebdriverIO.Capabilities
        if (caps?.browserName === 'safari' && (result as { error?: string } | undefined)?.error === 'no such element') {
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
                await fetched.waitForClickable()
                return await execute()
            } catch {
                const elementHTML = await fetched.getHTML()
                err.name = 'webdriverio(middleware): element did not become interactable'
                err.message = `Element ${elementHTML} did not become interactable`
                err.stack = err.stack ?? Error.captureStackTrace(err) ?? ''
            }
        }

        if (err.name === 'stale element reference' || isStaleElementError(err)) {
            try {
                const refetched = await refetchElement(element, commandName)
                element.elementId = refetched.elementId
                element.parent = refetched.parent
                return await execute()
            } catch (refetchErr) {
                /**
                 * If refetch fails (e.g., page navigated away and elements
                 * are no longer found), re-throw the original stale element
                 * error instead of masking it with "Index out of bounds"
                 * or other refetch errors.
                 *
                 * A strict-mode violation is the exception: the element was
                 * found again, but more than once, which is a real error the
                 * user needs to see, as in `implicitWait`.
                 */
                if (refetchErr instanceof StrictSelectorError) {
                    throw refetchErr
                }
                if (!(refetchErr instanceof Error) || !isStaleElementError(refetchErr)) {
                    throw err
                }
                throw refetchErr
            }
        }

        throw err
    }
}

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  command shim
 */
export const elementErrorHandler = (fn: Function) => (commandName: string, commandFn: Function) => {
    return function elementErrorHandlerCallback (this: WebdriverIO.Element, ...args: unknown[]) {
        /**
         * `$$` and the other element-list commands return an array directly.
         * An async wrapper would turn that array into a promise and `Array.isArray`
         * on `$('parent').$$('child')` would be false. The implicit wait instead
         * runs when the list is first read.
         */
        if ((ELEMENT_ARRAY_COMMANDS as readonly string[]).includes(commandName)) {
            return fn(commandName, function (this: WebdriverIO.Element, ...commandArgs: unknown[]) {
                const list = commandFn.apply(this, commandArgs)
                const wrap = list?.[ELEMENT_ARRAY_WRAP] as ((wrapper: (load: () => Promise<unknown>) => Promise<unknown>) => void) | undefined
                if (typeof wrap === 'function') {
                    const element = this
                    wrap(async (load) => invokeElementCommand(element, commandName, () => load()))
                }
                return list
            }).apply(this, args)
        }

        return fn(commandName, async function elementErrorHandlerCallbackFn (this: WebdriverIO.Element) {
            return invokeElementCommand(this, commandName, () => fn(commandName, commandFn).apply(this, args))
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
