import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import type { Options, Services } from '@wdio/types'

import { SUPPORTED_BROWSERNAMES, DEFAULT_PROTOCOL, DEFAULT_HOSTNAME, DEFAULT_PATH } from './constants.js'

const SCREENSHOT_REPLACEMENT = '"<Screenshot[base64]>"'
const SCRIPT_PLACEHOLDER = '"<Script[base64]>"'
const REGEX_SCRIPT_NAME = /return \((async )?function (\w+)/
const SLASH = '/'

function assertPath(path?: any) {
    if (typeof path !== 'string') {
        throw new TypeError('Path must be a string. Received ' + JSON.stringify(path))
    }
}

export function isAbsolute(p: string) {
    assertPath(p)
    return p.length > 0 && p.charCodeAt(0) === SLASH.codePointAt(0)
}

/**
 * overwrite native element commands with user defined
 * @param {object} propertiesObject propertiesObject
 */
export function overwriteElementCommands(propertiesObject: { '__elementOverrides__'?: { value: any }, [key: string]: any }) {
    const elementOverrides = propertiesObject.__elementOverrides__
        ? propertiesObject.__elementOverrides__.value
        : {}

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

        const newCommand = function (this: WebdriverIO.Browser, ...args: any[]) {
            const element = this
            return userDefinedCommand.apply(element, [
                function origCommandFunction (this: WebdriverIO.Browser) {
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

    delete propertiesObject.__elementOverrides__
    propertiesObject.__elementOverrides__ = { value: {} }
}

/**
 * get command call structure
 * (for logging purposes)
 */
export function commandCallStructure (commandName: string, args: any[], unfurl = false) {
    const callArgs = args.map((arg) => {
        if (typeof arg === 'string' && (arg.startsWith('!function(') || arg.startsWith('return (function') || arg.startsWith('return (async function'))) {
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
            arg = unfurl ? JSON.stringify(arg) : '<object>'
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
 * @param {object} result WebDriver response body
 */
export function transformCommandLogResult (result: { file?: string, script?: string }) {
    if (typeof result.file === 'string' && isBase64(result.file)) {
        return SCREENSHOT_REPLACEMENT
    } else if (typeof result.script === 'string' && isBase64(result.script)) {
        return SCRIPT_PLACEHOLDER
    } else if (typeof result.script === 'string' && result.script.match(REGEX_SCRIPT_NAME)) {
        const newScript = result.script.match(REGEX_SCRIPT_NAME)![2]
        return { ...result, script: `${newScript}(...) [${Buffer.byteLength(result.script, 'utf-8')} bytes]` }
    } else if (typeof result.script === 'string' && result.script.startsWith('!function(')) {
        return { ...result, script: `<minified function> [${Buffer.byteLength(result.script, 'utf-8')} bytes]` }
    }

    return result
}

/**
 * checks if command argument is valid according to specification
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
 * Utility to import modules with user friendly error message
 * @param moduleName  The name of the module to import
 * @param namedImport The name of the import to return
 * @returns          The imported module
 */
export async function userImport<T> (moduleName: string, namedImport = 'default'): Promise<T> {
    try {
        const mod = await import(/* @vite-ignore */moduleName)
        if (namedImport in mod) {
            return mod[namedImport]
        }
    } catch (err) {
        throw new Error(`Couldn't import "${moduleName}"! Do you have it installed? If not run "npm install ${moduleName}"!`)
    }

    throw new Error(`Couldn't find "${namedImport}" in module "${moduleName}"`)
}

/**
 * Allows to safely require a package, it only throws if the package was found
 * but failed to load due to syntax errors
 * @param  {string} name  of package
 * @return {object}       package content
 */
export async function safeImport (name: string): Promise<Services.ServicePlugin | null> {
    let importPath = name
    try {
        /**
         * Initially we will search for the package by using the standard package
         * resolution starting from the path given by 'import.meta.url' (which
         * returns the path to this file). The default mechanism will then search
         * upwards through the hierarchy in the file system in node_modules directories
         * until it finds the package or reaches the root of the file system.
         *
         * In the case where a user has installed the @wdio/cli package globally,
         * then clearly the search will be performed in the global area and not
         * in the project specific area.  Consequently, if the package we are
         * looking for is installed within the project it will not be found and
         * then we also need to search in the project, we do that by defining
         * 'localNodeModules' and searching from that also.
         *
         * Note that import-meta-resolve will resolve to CJS no ESM export is found.
         * Only in Node.js environments
         */
        if (!globalThis.window) {
            const { resolve } = await import('import-meta-resolve')
            try {
                importPath = await resolve(name, import.meta.url)
            } catch (err: any) {
                const localNodeModules = path.join(process.cwd(), 'node_modules')
                try {
                    importPath = await resolve(name, url.pathToFileURL(localNodeModules).toString())
                } catch (err: any) {
                    return null
                }
            }
        }
    } catch (err: any) {
        return null
    }

    try {
        const pkg = await import(/* @vite-ignore */importPath)

        /**
         * CJS packages build with TS imported through an ESM context can end up being this:
         *
         * [Module: null prototype] {
         *   __esModule: true,
         *   default: {
         *       launcher: [class SmokeServiceLauncher],
         *       default: [class SmokeService]
         *   },
         *   launcher: [class SmokeServiceLauncher]
         * }
         *
         * In order to not have the testrunner ignore importing a service we should double check if
         * a nested default is given and return that.
         */
        if (pkg.default && pkg.default.default) {
            return pkg.default
        }
        return pkg
    } catch (e: any) {
        throw new Error(`Couldn't initialize "${name}".\n${e.stack}`)
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
 * @param {string} str string to check
 * @return {boolean} `true` if the provided string is Base64
 */
export function isBase64(str: string) {
    if (typeof str !== 'string') {
        throw new Error('Expected string but received invalid type.')
    }
    const len = str.length
    const notBase64 = /[^A-Z0-9+/=]/i
    if (!len || len % 4 !== 0 || notBase64.test(str)) {
        return false
    }
    const firstPaddingChar = str.indexOf('=')
    return (
        firstPaddingChar === -1 ||
        firstPaddingChar === len - 1 ||
        (firstPaddingChar === len - 2 && str[len - 1] === '=')
    )
}

/**
 * sleep
 * @param {number=0} ms number in ms to sleep
 */
export const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))

/**
 * Checks if the provided WebdriverIO capabilities object is related to Appium.
 *
 * @param {WebdriverIO.Capabilities} caps - The capabilities object to check.
 * @returns {boolean} Returns true if the provided capabilities are related to Appium, false otherwise.
*/
export function isAppiumCapability(caps: WebdriverIO.Capabilities): boolean {
    return Boolean(
        caps &&
        (
            // @ts-expect-error outdated jsonwp cap
            caps.automationName ||
            caps['appium:automationName'] ||
            // @ts-expect-error outdated jsonwp cap
            caps.deviceName ||
            caps['appium:deviceName'] ||
            // @ts-expect-error outdated jsonwp cap
            caps.appiumVersion ||
            caps['appium:appiumVersion']
        )
    )
}

/**
 * helper method to determine if we need to setup a browser driver
 * which is:
 *   - whenever the user has set connection options that differ
 *     from the default, or a port is set
 *   - whenever the user defines `user` and `key` which later will
 *     update the connection options
 */
export function definesRemoteDriver(options: Pick<Options.WebDriver, 'user' | 'key' | 'protocol' | 'hostname' | 'port' | 'path'>) {
    return Boolean(
        (options.protocol && options.protocol !== DEFAULT_PROTOCOL) ||
        (options.hostname && options.hostname !== DEFAULT_HOSTNAME) ||
        Boolean(options.port) ||
        (options.path && options.path !== DEFAULT_PATH) ||
        Boolean(options.user && options.key)
    )
}

export function isChrome (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.chrome.includes(browserName.toLowerCase()))
}
export function isSafari (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.safari.includes(browserName.toLowerCase()))
}
export function isFirefox (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.firefox.includes(browserName.toLowerCase()))
}
export function isEdge (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.edge.includes(browserName.toLowerCase()))
}

/**
 * traverse up the scope chain until browser element was reached
 */
export function getBrowserObject (elem: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.ElementArray): WebdriverIO.Browser {
    const elemObject = elem as WebdriverIO.Element
    return (elemObject as WebdriverIO.Element).parent ? getBrowserObject(elemObject.parent) : elem as WebdriverIO.Browser
}

/**
 * Enables logging to a file in a specified directory.
 * @param  {string} outputDir  Directory containing the log file
 */
export async function enableFileLogging (outputDir?: string): Promise<void> {
    if (!outputDir) {
        return
    }

    await fs.mkdir(path.join(outputDir), { recursive: true })
    process.env.WDIO_LOG_PATH = path.join(outputDir, 'wdio.log')
}
