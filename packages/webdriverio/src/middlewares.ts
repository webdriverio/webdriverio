import { ELEMENT_KEY } from 'webdriver'
import { ELEMENT_ARRAY_COMMANDS, ELEMENT_ARRAY_WRAP, getBrowserObject } from '@wdio/utils'
import {
    WebDriverProtocol, AppiumProtocol, ChromiumProtocol, GeckoProtocol, SauceLabsProtocol, SeleniumProtocol,
    type Protocol
} from '@wdio/protocols'

import refetchElement from './utils/refetchElement.js'
import implicitWait from './utils/implicitWait.js'
import { isElementNotFoundAgain, nameNotFoundAgain, notFoundElement, waitedFor } from './utils/elementNotFound.js'
import { isStaleElementError } from './utils/index.js'
/**
 * imported from the leaf module directly, see `utils/implicitWait.ts`
 */
import { StrictSelectorError } from './utils/strictSelectorError.js'

export const IMPLICIT_WAIT_EXCLUSION_LIST = ['getElement', 'getElements']

/**
 * The protocol commands that get the element id as their first argument: the `:elementId`
 * of the endpoint, which is always its first variable
 */
const ELEMENT_ID_COMMANDS = new Set(
    ([WebDriverProtocol, AppiumProtocol, ChromiumProtocol, GeckoProtocol, SauceLabsProtocol, SeleniumProtocol] as Protocol[])
        .flatMap((protocol) => Object.values(protocol).flatMap((endpoint) => Object.values(endpoint)))
        .filter((info) => info?.variables?.[0]?.name === 'elementId')
        .map((info) => info!.command)
)

/**
 * The arguments of a protocol command, with the element id that went stale replaced by the id
 * of the element that was found again (e.g. `this.getElementText(this.elementId)`). Only the
 * `elementId` argument changes: the other arguments (e.g. the text of `elementSendKeys`) and
 * the arguments of other commands are data of the caller.
 */
function withElementId (commandName: string, args: unknown[], staleId: string | undefined, newId: string | undefined) {
    if (!staleId || !newId || !ELEMENT_ID_COMMANDS.has(commandName) || args[0] !== staleId) {
        return args
    }
    return [newId, ...args.slice(1)]
}

/**
 * Run an element command after the implicit wait, and retry it when the element
 * is stale or not yet interactable. `execute` is the command itself, without
 * this wrapper, so a retry does not wait a second time.
 */
async function invokeElementCommand (
    element: WebdriverIO.Element,
    commandName: string,
    args: unknown[],
    execute: (args: unknown[]) => Promise<unknown>
): Promise<unknown> {
    if (IMPLICIT_WAIT_EXCLUSION_LIST.includes(commandName)) {
        return execute(args)
    }

    const fetched = await implicitWait(element, commandName)
    element.elementId = fetched.elementId
    element[ELEMENT_KEY] = fetched.elementId
    /**
     * the id that the arguments can hold: an inner command can change the id of `element`
     */
    const calledWithId = fetched.elementId

    try {
        const result = await execute(args)

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
                /**
                 * the wait can find the element again: the retry gets its new id
                 */
                await fetched.waitForClickable()
                return await execute(withElementId(commandName, args, calledWithId, fetched.elementId))
            } catch {
                const elementHTML = await fetched.getHTML()
                err.name = 'webdriverio(middleware): element did not become interactable'
                err.message = `Element ${elementHTML} did not become interactable`
                err.stack = err.stack ?? Error.captureStackTrace(err) ?? ''
            }
        }

        /**
         * The "element wasn't found" error of a wait (an element that was not found again, or
         * never found) is not a stale element error, also when its message has that text (a
         * selector like `[data-error="stale element reference"]`). So the outer layers of a
         * command do not look for an element that an inner layer did not find, and do not run
         * the command again (9.31.9 did not either: the command would repeat its steps and wait
         * again for an element that it kept).
         */
        const stale = !waitedFor(err) && (err.name === 'stale element reference' || isStaleElementError(err))
        if (stale) {
            try {
                const refetched = await refetchElement(element, commandName)
                element.elementId = refetched.elementId
                /**
                 * also the w3c identifier, which e.g. an action origin reads
                 */
                element[ELEMENT_KEY] = refetched.elementId
                element.parent = refetched.parent
                return await execute(withElementId(commandName, args, calledWithId, refetched.elementId))
            } catch (refetchErr) {
                /**
                 * A strict-mode violation is a real error the user needs to see, as in
                 * `implicitWait`.
                 */
                if (refetchErr instanceof StrictSelectorError) {
                    throw refetchErr
                }
                /**
                 * The lookup, or a lookup of the command run again, waited `waitforTimeout` for
                 * the element (or a parent) and did not find it: throw its "element wasn't found"
                 * error. The outer layers of the command do not handle it, so they do not wait
                 * for the element again (#16072). A lookup records the element that it did not
                 * find: name the error for this command, with the stale element error of the
                 * driver as its cause. An element that the command never found keeps its plain
                 * error.
                 */
                if (waitedFor(refetchErr)) {
                    if (refetchErr instanceof Error && notFoundElement(refetchErr) !== undefined) {
                        nameNotFoundAgain(refetchErr, element, commandName, err)
                    }
                    throw refetchErr
                }
                /**
                 * Any other failure gives the original stale element error instead of masking
                 * it with an unrelated error, and an outer layer can find the element again
                 * (#15627).
                 */
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
    /**
     * `fn` (the command wrapper) runs the command hooks and builds the chain of the result once,
     * around the middleware; the command itself runs without a second wrapper, which ran the
     * hooks again (a leftover of the sync mode of v5).
     *
     * `$$` and the other element-list commands return an array directly. An async wrapper would
     * turn that array into a promise and `Array.isArray` on `$('parent').$$('child')` would be
     * false. The implicit wait instead runs when the list is first read.
     */
    const wrap = () => (ELEMENT_ARRAY_COMMANDS as readonly string[]).includes(commandName)
        ? fn(commandName, function (this: WebdriverIO.Element, ...commandArgs: unknown[]) {
            const list = commandFn.apply(this, commandArgs)
            const wrapList = list?.[ELEMENT_ARRAY_WRAP] as ((wrapper: (load: () => Promise<unknown>) => Promise<unknown>) => void) | undefined
            if (typeof wrapList === 'function') {
                const element = this
                wrapList(async (load) => invokeElementCommand(element, commandName, [], () => load()))
            }
            return list
        })
        : fn(commandName, async function elementErrorHandlerCallbackFn (this: WebdriverIO.Element, ...callArgs: unknown[]) {
            return invokeElementCommand(this, commandName, callArgs, (args) => commandFn.apply(this, args))
        })

    // the wrapper is built on the first call and kept: an element has ~280 commands and uses few
    let wrapped: Function | undefined
    return function elementErrorHandlerCallback (this: WebdriverIO.Element, ...args: unknown[]) {
        return (wrapped ??= wrap()).apply(this, args)
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
