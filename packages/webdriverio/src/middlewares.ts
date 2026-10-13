import { ELEMENT_KEY } from 'webdriver'
import { ELEMENT_ARRAY_COMMANDS, ELEMENT_ARRAY_WRAP, getBrowserObject } from '@wdio/utils'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { gaveUpFor, markGaveUp, waitedFor, isStaleError } from './utils/elementLookup.js'
/**
 * imported from the leaf module directly, see `utils/implicitWait.ts`
 */
import { StrictSelectorError } from './utils/strictSelectorError.js'

export const IMPLICIT_WAIT_EXCLUSION_LIST = ['getElement', 'getElements', 'emit']

/**
 * checks, whose lookup of a stale element does not wait for it: they look again, and
 * answer at once. Not the wider list of `implicitWait`: a `waitFor*` or `waitUntil`
 * layer that looked again would run the whole wait again
 */
const CHECK_COMMANDS = /^(isExisting|is\w*Displayed|is\w*Clickable)$/

/**
 * The error to throw when the lookup of a stale element, or the command after it, failed
 * with `lookupErr`: a stale element error of the lookup, else the original error `err`.
 */
function errorAfterLookup (lookupErr: unknown, err: Error): unknown {
    return lookupErr instanceof Error && isStaleError(lookupErr) ? lookupErr : err
}

/**
 * Run an element command after the implicit wait, and retry it when the element
 * is stale or not yet interactable. `execute` is the command itself, without
 * this wrapper, so a retry does not wait a second time.
 *
 * A command runs other commands on its element, each in a layer of this wrapper. A layer
 * that waited for the element and did not find it records that on the error that it throws
 * (`utils/elementLookup.ts`): the outer layers of the element throw this error at once
 * instead of waiting again.
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

        if (isStaleError(err)) {
            /**
             * an inner layer already waited for the element and did not find it
             */
            if (gaveUpFor(err, element) && !CHECK_COMMANDS.test(commandName)) {
                throw err
            }
            let refetched: WebdriverIO.Element
            try {
                refetched = await refetchElement(element, commandName)
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
                /**
                 * the lookup waited for the element (or a parent) and did not find it: the
                 * outer layers of the element do not look again. Any other failure of the
                 * lookup leaves them to look again.
                 */
                const thrown = errorAfterLookup(refetchErr, err)
                if (waitedFor(refetchErr)) {
                    markGaveUp(thrown, element)
                }
                throw thrown
            }

            element.elementId = refetched.elementId
            /**
             * also the w3c identifier, which e.g. an action origin reads
             */
            element[ELEMENT_KEY] = refetched.elementId
            element.parent = refetched.parent
            try {
                return await execute()
            } catch (retryErr) {
                if (retryErr instanceof StrictSelectorError) {
                    throw retryErr
                }
                /**
                 * the element was found again and the command waited for an element that it
                 * did not find: that is the cause of the failure
                 */
                if (waitedFor(retryErr)) {
                    throw retryErr
                }
                throw errorAfterLookup(retryErr, err)
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
