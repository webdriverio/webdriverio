import fs from 'node:fs'

import type { Services, Clients } from '@wdio/types'

const SCREENSHOT_REPLACEMENT = '"<Screenshot[base64]>"'
const SCRIPT_PLACEHOLDER = '"<Script[base64]>"'
const REGEX_SCRIPT_NAME = /return \(function (\w+)/

/**
 * overwrite native element commands with user defined
 * @param {object} propertiesObject propertiesObject
 */
export function overwriteElementCommands(propertiesObject: { '__elementOverrides__'?: { value: any }, [key: string]: any }) {
    const elementOverrides = propertiesObject['__elementOverrides__'] ? propertiesObject['__elementOverrides__'].value : {}

    for (const [commandName, userDefinedCommand] of Object.entries(elementOverrides)) {
        if (typeof userDefinedCommand !== 'function') {
            throw new Error('overwriteCommand: commands be overwritten only with functions, command: ' + commandName)
        }

        if (!propertiesObject[commandName]) {
            throw new Error('overwriteCommand: no command to be overwritten: ' + commandName)
        }

        if (typeof propertiesObject[commandName].value !== 'function') {
            throw new Error('overwriteCommand: only functions can be overwritten, command: ' + commandName)
        }

        const origCommand = propertiesObject[commandName].value
        delete propertiesObject[commandName]

        const newCommand = function (this: Clients.Browser, ...args: any[]) {
            const element = this
            return userDefinedCommand.apply(element, [
                function origCommandFunction (this: Clients.Browser) {
                    const context = this || element // respect explicite context binding, use element as default
                    return origCommand.apply(context, arguments)
                },
                ...args
            ])
        }

        propertiesObject[commandName] = {
            value: newCommand,
            configurable: true
        }
    }

    delete propertiesObject['__elementOverrides__']
    propertiesObject['__elementOverrides__'] = { value: {} }
}

/**
 * get command call structure
 * (for logging purposes)
 */
export function commandCallStructure (commandName: string, args: any[]) {
    const callArgs = args.map((arg) => {
        if (typeof arg === 'string' && (arg.startsWith('!function(') || arg.startsWith('return (function'))) {
            arg = '<fn>'
        } else if (
            typeof arg === 'string' &&
            /**
             * the isBase64 method returns for xPath values like
             * "/html/body/a" a true value which is why we should
             * include a command check in here.
             */
            !commandName.startsWith('findElement') &&
            isBase64(arg)
        ) {
            arg = SCREENSHOT_REPLACEMENT
        } else if (typeof arg === 'string') {
            arg = `"${arg}"`
        } else if (typeof arg === 'function') {
            arg = '<fn>'
        } else if (arg === null) {
            arg = 'null'
        } else if (typeof arg === 'object') {
            arg = '<object>'
        } else if (typeof arg === 'undefined') {
            arg = typeof arg
        }

        return arg
    }).join(', ')

    return `${commandName}(${callArgs})`
}

/**
 * transforms WebDriver result for log stream to avoid unnecessary long
 * result strings e.g. if it contains a screenshot
 * @param {Object} result WebDriver response body
 */
export function transformCommandLogResult (result: { file?: string, script?: string }) {
    if (typeof result.file === 'string' && isBase64(result.file)) {
        return SCREENSHOT_REPLACEMENT
    } else if (typeof result.script === 'string' && isBase64(result.script)) {
        return SCRIPT_PLACEHOLDER
    } else if (typeof result.script === 'string' && result.script.match(REGEX_SCRIPT_NAME)) {
        const newScript = result.script.match(REGEX_SCRIPT_NAME)![1]
        return { ...result, script: `${newScript}(...) [${Buffer.byteLength(result.script, 'utf-8')} bytes]` }
    }

    return result
}

/**
 * checks if command argument is valid according to specificiation
 *
 * @param  {*}       arg           command argument
 * @param  {Object}  expectedType  parameter type (e.g. `number`, `string[]` or `(number|string)`)
 * @return {Boolean}               true if argument is valid
 */
export function isValidParameter (arg: any, expectedType: string) {
    let shouldBeArray = false

    if (expectedType.slice(-2) === '[]') {
        expectedType = expectedType.slice(0, -2)
        shouldBeArray = true
    }

    /**
     * check type of each individual array element
     */
    if (shouldBeArray) {
        if (!Array.isArray(arg)) {
            return false
        }
    } else {
        /**
         * transform to array to have a unified check
         */
        arg = [arg]
    }

    for (const argEntity of arg) {
        const argEntityType = getArgumentType(argEntity)
        if (!argEntityType.match(expectedType)) {
            return false
        }
    }

    return true
}

/**
 * get type of command argument
 */
export function getArgumentType (arg: any) {
    return arg === null ? 'null' : typeof arg
}

/**
 * Allows to safely require a package, it only throws if the package was found
 * but failed to load due to syntax errors
 * @param  {string} name  of package
 * @return {object}       package content
 */
export async function safeImport (name: string): Promise<Services.ServicePlugin | null> {
    let requirePath = name
    try {
        /**
         * Check if cli command was called from local directory, if not require
         * the plugin from the place where the command is called. This avoids
         * issues where user have the @wdio/cli package installed globally
         * but run on a project where wdio packages are installed locally. It
         * also allows to link the package to a random place and have plugins
         * imported correctly (for dev purposes).
         */
        /* istanbul ignore if */
        if (import.meta.resolve) {
            requirePath = await import.meta.resolve(name)
        }
    } catch (err: any) {
        return null
    }

    try {
        return import(requirePath)
    } catch (e: any) {
        throw new Error(`Couldn't initialise "${name}".\n${e.stack}`)
    }
}

/**
 * is function async
 * @param  {Function} fn  function to check
 * @return {Boolean}      true provided function is async
 */
export function isFunctionAsync (fn: Function) {
    return (fn.constructor && fn.constructor.name === 'AsyncFunction') || fn.name === 'async'
}

/**
 * filter out arguments passed to specFn & hookFn, don't allow callbacks
 * as there is no need for user to call e.g. `done()`
 */
export function filterSpecArgs (args: any[]) {
    return args.filter((arg) => typeof arg !== 'function')
}

/**
 * checks if provided string is Base64
 * @param  {String} str  string in base64 to check
 * @return {Boolean} true if the provided string is Base64
 */
export function isBase64(str: string) {
    var notBase64 = new RegExp('[^A-Z0-9+\\/=]',  'i')
    if (typeof str !== 'string') {
        throw new Error('Expected string but received invalid type.')
    }
    const len = str.length
    if (!len || len % 4 !== 0 || notBase64.test(str)) {
        return false
    }
    const firstPaddingChar = str.indexOf('=')
    return firstPaddingChar === -1 ||
      firstPaddingChar === len - 1 ||
      (firstPaddingChar === len - 2 && str[len - 1] === '=')
}

/**
 * Helper utility to check file access
 * @param {String} file file to check access for
 * @return              true if file can be accessed
 */
export const canAccess = (file: string) => {
    if (!file) {
        return false
    }

    try {
        fs.accessSync(file)
        return true
    } catch (err: any) {
        return false
    }
}

/**
 * sleep
 * @param {number=0} ms number in ms to sleep
 */
export const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))
