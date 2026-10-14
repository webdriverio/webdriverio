import { ELEMENT_KEY } from 'webdriver'
import { ELEMENT_ARRAY_COMMANDS, ELEMENT_ARRAY_WRAP, getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isElementNotFoundAgain, isListItemNotFoundAgain, nameNotFoundAgain, waitedFor } from './utils/elementNotFound.js'
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
        /**
         * an inner layer of the command did not find the element again: name this command
         */
        if (isElementNotFoundAgain(err)) {
            nameNotFoundAgain(err, element, commandName)
        }
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

        /**
         * The command looked for an item of a `$$()` list of this element, and the page
         * rendered the list again without it: run the command once more, it finds its items
         * again. Not for an element that the command kept from before (`$()`): it would only
         * wait for it again.
         */
        /**
         * the error of an element that was not found again is not a stale element error, also
         * when its message has that text (a selector like `[data-error="stale element reference"]`)
         */
        const stale = !isElementNotFoundAgain(err) && (err.name === 'stale element reference' || isStaleElementError(err))
        if (stale || isListItemNotFoundAgain(err, element)) {
            try {
                let refetched: WebdriverIO.Element
                try {
                    refetched = await refetchElement(element, commandName)
                } catch (lookupErr) {
                    /**
                     * the page removed the element (or a parent): name the error, and keep the
                     * stale element error as its cause, see `ELEMENT_NOT_FOUND_AGAIN`
                     */
                    if (waitedFor(lookupErr) && lookupErr instanceof Error && Object.isExtensible(lookupErr)) {
                        nameNotFoundAgain(lookupErr, element, commandName)
                        const withCause: Error & { cause?: unknown } = lookupErr
                        /**
                         * the stale element error of the driver, also after a list item that
                         * was not found again
                         */
                        withCause.cause ??= isElementNotFoundAgain(err) ? (err as Error & { cause?: unknown }).cause ?? err : err
                    }
                    throw lookupErr
                }
                element.elementId = refetched.elementId
                /**
                 * also the w3c identifier, which e.g. an action origin reads
                 */
                element[ELEMENT_KEY] = refetched.elementId
                element.parent = refetched.parent
                return await execute()
            } catch (refetchErr) {
                /**
                 * The lookup, or a lookup of the command run again, waited `waitforTimeout`
                 * for the element (or a parent) and did not find it: throw its "element
                 * wasn't found" error. The outer layers of the command do not handle it, so
                 * they do not wait for the element again (#16072).
                 *
                 * A strict-mode violation is a real error the user needs to see, as in
                 * `implicitWait`. Any other failure gives the original stale element error
                 * instead of masking it with an unrelated error, and an outer layer can find
                 * the element again (#15627).
                 */
                if (refetchErr instanceof StrictSelectorError || waitedFor(refetchErr)) {
                    /**
                     * the command run again did not find the element again: name this command
                     */
                    if (isElementNotFoundAgain(refetchErr)) {
                        nameNotFoundAgain(refetchErr as Error, element, commandName)
                    }
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
