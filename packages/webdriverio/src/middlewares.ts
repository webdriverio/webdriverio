
import refetchElement from './utils/refetchElement'
import implicitWait from './utils/implicitWait'
import { ELEMENT_KEY } from './constants'
import { getBrowserObject } from './utils'
import type { Capabilities } from '@wdio/types'

/**
 * This method is an command wrapper for elements that checks if a command is called
 * that wasn't found on the page and automatically waits for it
 *
 * @param  {Function} fn  commandWrap from wdio-sync package (or shim if not running in sync)
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
                if (result && result.error === 'no such element') {
                    const browser = getBrowserObject(element)
                    const capabilities = browser?.capabilities as Capabilities.Capabilities
                    if (capabilities?.browserName?.includes('safari')) {
                        const err = new Error()
                        err.name = 'stale element reference'
                        throw err
                    }
                }

                return result
            } catch (error) {
                if (error.name === 'stale element reference') {
                    const element = await refetchElement(this, commandName)
                    this.elementId = element.elementId
                    this.parent = element.parent

                    return await fn(commandName, commandFn).apply(this, args)
                }
                throw error
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
