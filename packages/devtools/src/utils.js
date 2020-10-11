import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import logger from '@wdio/logger'
import { commandCallStructure, isValidParameter, getArgumentType, canAccess } from '@wdio/utils'
import { WebDriverProtocol } from '@wdio/protocols'

import cleanUp from './scripts/cleanUpSerializationSelector'
import { ELEMENT_KEY, SERIALIZE_PROPERTY, SERIALIZE_FLAG, ERROR_MESSAGES, PPTR_LOG_PREFIX } from './constants'

const log = logger('devtools')

export const validate = function (command, parameters, variables, ref, args) {
    const commandParams = [...variables.map((v) => Object.assign(v, {
        /**
         * url variables are:
         */
        required: true, // always required as they are part of the endpoint
        type: 'string'  // have to be always type of string
    })), ...parameters]

    const commandUsage = `${command}(${commandParams.map((p) => p.name).join(', ')})`
    const moreInfo = `\n\nFor more info see ${ref}\n`
    const body = {}

    /**
     * parameter check
     */
    const minAllowedParams = commandParams.filter((param) => param.required).length
    if (args.length < minAllowedParams || args.length > commandParams.length) {
        const parameterDescription = commandParams.length
            ? `\n\nProperty Description:\n${commandParams.map((p) => `  "${p.name}" (${p.type}): ${p.description}`).join('\n')}`
            : ''

        throw new Error(
            `Wrong parameters applied for ${command}\n` +
            `Usage: ${commandUsage}` +
            parameterDescription +
            moreInfo
        )
    }

    /**
     * parameter type check
     */
    for (const [i, arg] of Object.entries(args)) {
        const commandParam = commandParams[i]

        if (!isValidParameter(arg, commandParam.type)) {
            /**
             * ignore if argument is not required
             */
            if (typeof arg === 'undefined' && !commandParam.required) {
                continue
            }

            throw new Error(
                `Malformed type for "${commandParam.name}" parameter of command ${command}\n` +
                `Expected: ${commandParam.type}\n` +
                `Actual: ${getArgumentType(arg)}` +
                moreInfo
            )
        }

        /**
         * rest of args are part of body payload
         */
        body[commandParams[i].name] = arg
    }

    log.info('COMMAND', commandCallStructure(command, args))
    return body
}

export function getPrototype (commandWrapper) {
    const prototype = {}

    for (const [endpoint, methods] of Object.entries(WebDriverProtocol)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: commandWrapper(method, endpoint, commandData) }
        }
    }

    return prototype
}

export async function findElement (context, using, value) {
    /**
     * implicitly wait for the element if timeout is set
     */
    const implicitTimeout = this.timeouts.get('implicit')
    const waitForFn = using === 'xpath' ? context.waitForXPath : context.waitForSelector
    if (implicitTimeout && waitForFn) {
        await waitForFn.call(context, value, { timeout: implicitTimeout })
    }

    let element
    try {
        element = using === 'xpath'
            ? (await context.$x(value))[0]
            : await context.$(value)
    } catch (err) {
        /**
         * throw if method failed for other reasons
         */
        if (!err.message.includes('failed to find element')) {
            throw err
        }
    }

    if (!element) {
        return new Error(`Element with selector "${value}" not found`)
    }

    const elementId = this.elementStore.set(element)

    /**
     * return value has to be defined this way because of
     * https://github.com/microsoft/TypeScript/issues/37832
     */
    const returnValue = {}
    returnValue[ELEMENT_KEY] = elementId

    return returnValue
}

export async function findElements (context, using, value) {
    /**
     * implicitly wait for the element if timeout is set
     */
    const implicitTimeout = this.timeouts.get('implicit')
    const waitForFn = using === 'xpath' ? context.waitForXPath : context.waitForSelector
    if (implicitTimeout && waitForFn) {
        await waitForFn.call(context, value, { timeout: implicitTimeout })
    }

    const elements = using === 'xpath'
        ? await context.$x(value)
        : await context.$$(value)

    if (elements.length === 0) {
        return elements
    }

    return elements.map((element) => ({
        [ELEMENT_KEY]: this.elementStore.set(element)
    }))
}

/**
 * convert DevTools errors into WebDriver errors so tools upstream
 * can handle it in similar fashion (e.g. stale element)
 */
export function sanitizeError (err) {
    let errorMessage = err.message

    if (err.message.includes('Node is detached from document')) {
        err.name = ERROR_MESSAGES.staleElement.name
        errorMessage = ERROR_MESSAGES.staleElement.message
    }

    const stack = err.stack.split('\n')
    const asyncStack = stack.lastIndexOf('  -- ASYNC --')
    err.stack = errorMessage + '\n' + stack.slice(asyncStack + 1)
        .filter((line) => !line.includes('devtools/node_modules/puppeteer-core'))
        .join('\n')
    return err
}

/**
 * transform elements in argument list to Puppeteer element handles
 */
export async function transformExecuteArgs (args = []) {
    return Promise.all(args.map(async (arg) => {
        if (arg[ELEMENT_KEY]) {
            const elementHandle = await this.elementStore.get(arg[ELEMENT_KEY])

            if (!elementHandle) {
                throw getStaleElementError(arg[ELEMENT_KEY])
            }

            arg = elementHandle
        }

        return arg
    }))
}

/**
 * fetch marked elements from execute script
 */
export async function transformExecuteResult (page, result) {
    const isResultArray = Array.isArray(result)
    let tmpResult = isResultArray ? result : [result]

    if (tmpResult.find((r) => typeof r === 'string' && r.startsWith(SERIALIZE_FLAG))) {
        tmpResult = await Promise.all(tmpResult.map(async (r) => {
            if (typeof r === 'string' && r.startsWith(SERIALIZE_FLAG)) {
                return findElement.call(this, page, 'css selector', `[${SERIALIZE_PROPERTY}="${r}"]`)
            }

            return result
        }))

        await page.$$eval(`[${SERIALIZE_PROPERTY}]`, cleanUp, SERIALIZE_PROPERTY)
    }

    return isResultArray ? tmpResult : tmpResult[0]
}

export function getStaleElementError (elementId) {
    const error = new Error(
        `stale element reference: The element with reference ${elementId} is stale; either the ` +
        'element is no longer attached to the DOM, it is not in the current frame context, or the ' +
        'document has been refreshed'
    )
    error.name = 'stale element reference'
    return error
}

/**
 * Helper function to get a list of Puppeteer pages from a Chrome browser.
 * In case many headless browser are run in parallel there are situations
 * where there are no pages because the machine is busy booting the headless
 * browser.
 *
 * @param  {Puppeteer.Browser} browser  browser instance
 * @return {Puppeteer.Page[]}           list of browser pages
 */
export async function getPages (browser, retryInterval = 100) {
    const pages = await browser.pages()

    if (pages.length === 0) {
        log.info('no browser pages found, retrying...')

        /**
         * wait for some milliseconds to try again
         */
        await new Promise((resolve) => setTimeout(resolve, retryInterval))
        return getPages(browser)
    }

    return pages
}

export function sort(installations, priorities) {
    const defaultPriority = 10
    return installations
        // assign priorities
        .map((inst) => {
            for (const pair of priorities) {
                if (pair.regex.test(inst)) {
                    return { path: inst, weight: pair.weight }
                }
            }

            return { path: inst, weight: defaultPriority }
        })
        // sort based on priorities
        .sort((a, b) => (b.weight - a.weight))
        // remove priority flag
        .map(pair => pair.path)
}

/**
 * helper utitlity to clone a list
 * @param  {Any[]} arr  list of things
 * @return {Any[]}      new list of same things
 */
export function uniq(arr) {
    return Array.from(new Set(arr))
}

/**
 * Look for edge executables by using the which command
 */
export function findByWhich (executables, priorities) {
    const installations = []
    executables.forEach((executable) => {
        try {
            const browserPath = execFileSync(
                'which',
                [executable],
                { stdio: 'pipe' }
            ).toString().split(/\r?\n/)[0]

            if (canAccess(browserPath)) {
                installations.push(browserPath)
            }
        } catch (e) {
            // Not installed.
        }
    })

    return sort(uniq(installations.filter(Boolean)), priorities)
}

/**
 * monkey patch debug package to log CDP messages from Puppeteer
 */
export function patchDebug (scoppedLogger) {
    /**
     * log puppeteer messages
     */
    let puppeteerDebugPkg = path.resolve(
        path.dirname(require.resolve('puppeteer-core')),
        'node_modules',
        'debug')

    /**
     * check if Puppeteer has its own version of debug, if not use the
     * one that is installed for all packages
     */
    if (!fs.existsSync(puppeteerDebugPkg)) {
        /**
         * let's not get caught by our dep checker, therefor
         * define package name in variable first
         */
        const pkgName = 'debug'
        puppeteerDebugPkg = require.resolve(pkgName)
    }

    require(puppeteerDebugPkg).log = (msg) => {
        if (msg.includes('puppeteer:protocol')) {
            msg = msg.slice(msg.indexOf(PPTR_LOG_PREFIX) + PPTR_LOG_PREFIX.length).trim()
        }
        scoppedLogger.debug(msg)
    }
}
