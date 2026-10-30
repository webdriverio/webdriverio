import url from 'node:url'

import supportsColor from './supportsColor.js'
import { COLORS } from './constants.js'
import type { HookKind } from './types.js'

const FIRST_FUNCTION_REGEX = /function (\w+)/

/**
 * @experimental a failed hook that is a failure of its own: its error is not already the failure of a test
 * (`failedTestUid`, e.g. a Vitest `beforeEach`) or of an attempt that the framework ran again (`retried`)
 */
export function hookCountsAsFailure(hook: { error?: unknown, retried?: boolean, failedTestUid?: string }): boolean {
    return Boolean(hook.error) && !hook.retried && !hook.failedTestUid
}

/**
 * @experimental a `beforeAll` / `afterAll` hook with `hookKind` and no context: it belongs to its suite, not to a unit.
 * A hook with no `hookKind` keeps the owner of today
 */
export function isContextlessAllHook(hook: { contextId?: string, hookKind?: HookKind }): boolean {
    return !hook.contextId && (hook.hookKind === 'beforeAll' || hook.hookKind === 'afterAll')
}

// a hook with no hookKind: the Mocha title rule (`"after each" hook ...`)
export function isAfterEachHook(hook: { hookKind?: HookKind, title?: string }): boolean {
    return hook.hookKind ? hook.hookKind === 'afterEach' : /^"after each" hook/.test(hook.title ?? '')
}

/**
 * the path of a spec file: a framework or the runner can send a file:// URL
 * (Jasmine with ESM specs, Mocha parallel mode, the specs of the runner);
 * a URL that names no path stays as it is
 */
export function specFilePath(file: string): string {
    if (!file.startsWith('file://')) {
        return file
    }
    try {
        return url.fileURLToPath(file)
    } catch {
        return file
    }
}

/**
 * the framework of a runner config, from its short name in any case or its scoped package, as
 * `initializePlugin` loads them (`'Cucumber'`, `'@wdio/cucumber-framework'`); `undefined` for another
 * framework, and for a path or a `file://` URL (the name of the framework is not known there)
 */
export function knownFramework(name?: string): 'cucumber' | 'mocha' | 'jasmine' | 'vitest' | undefined {
    const short = name?.toLowerCase().replace(/^@wdio\//, '').replace(/-framework$/, '')
    return short === 'cucumber' || short === 'mocha' || short === 'jasmine' || short === 'vitest' ? short : undefined
}

/**
 * replaces whitespaces with underscore and removes dots
 * @param  {string} str  variable to sanitize
 * @return {String}      sanitized variable
 */
export function sanitizeString (str?: string) {
    if (!str) {
        return ''
    }

    return String(str)
        .replace(/^.*\/([^/]+)\/?$/, '$1')
        .replace(/\./g, '_')
        .replace(/\s/g, '')
        .toLowerCase()
}

// an app URL can hold credentials or a token: only its file name stays, else its host
export function appFileName<T> (app: T): T | string {
    if (typeof app !== 'string') {
        return app
    }
    try {
        const url = new URL(app)
        if (['http:', 'https:', 'ftp:'].includes(url.protocol)) {
            const file = url.pathname.split('/').filter(Boolean).pop()
            if (!file) {
                return url.hostname
            }
            try {
                return decodeURIComponent(file)
            } catch {
                return file
            }
        }
    } catch {
        // not a URL
    }
    return app
}

/**
 * @experimental formats capability object into sanitized string for e.g.filenames
 * @param {object} caps  Selenium capabilities
 */
export function sanitizeCaps (caps?: WebdriverIO.Capabilities) {
    if (!caps) {
        return ''
    }

    let result

    /**
     * mobile caps
     */
    // @ts-expect-error legacy capability names
    result = caps['appium:deviceName'] || caps.deviceName
        ? [
            sanitizeString(caps.platformName),
            // @ts-expect-error legacy capability names
            sanitizeString(caps['appium:deviceName'] || caps.deviceName),
            sanitizeString(caps['appium:platformVersion']),
            sanitizeString(appFileName(caps['appium:app']))
        ]
        : [
            sanitizeString(caps.browserName),
            // @ts-expect-error legacy capability names
            sanitizeString(caps.version || caps.browserVersion),
            // @ts-expect-error legacy capability names
            sanitizeString(caps.platform || caps.platformName),
            sanitizeString(appFileName(caps['appium:app']))
        ]

    result = result.filter(n => n !== undefined && n !== '')
    return result.join('.')
}

/**
 * Takes a event emitted by a framework and extracts
 * an array of errors representing test or hook failures.
 * This exists to maintain compatibility between frameworks
 * with have a soft assertion model (Jasmine) and those that
 * have a hard assertion model (Mocha)
 * @param {*} e  An event emitted by a framework adapter
 */
export function getErrorsFromEvent(e: { errors?: Error[]; error?: Error }) {
    if (e.errors) {
        return e.errors
    }
    if (e.error) {
        return [e.error]
    }
    return []
}

/**
 * Pads the given `str` to `len`.
 *
 * @private
 * @param {string} str
 * @param {number} len
 * @return {string}
 */
export function pad (str: string, len: number) {
    return Array(len - str.length + 1).join(' ') + str
}

export function color (type: keyof typeof COLORS, content: string) {
    if (!supportsColor.stdout) {
        return String(content)
    }
    return `\u001b[${COLORS[type]}m${content}\u001b[0m`
}

/**
 * Colors lines for `str`, using the color `name`.
 *
 * @private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
export function colorLines (name: keyof typeof COLORS, str: string) {
    return str
        .split('\n')
        .map((str) => color(name, str))
        .join('\n')
}

/**
 * Transforms WebDriver execute command scripts to avoid accumulating
 * long scripts in the default TestStats.
 * @param script WebDriver command script
 */
export function transformCommandScript (script?: string|Function) {
    if (!script) {
        return script
    }
    let name = undefined
    if (typeof script === 'string') {
        name = FIRST_FUNCTION_REGEX.exec(script)
        // reset the static RegExp globals to avoid leaking `script`
        FIRST_FUNCTION_REGEX.exec('')
    } else if (typeof script === 'function') {
        name = script.name
        script = script.toString()
    } else {
        return `<${typeof script}>`
    }

    if (typeof name === 'string' && name) {
        return `<script fn ${name}(...)> [${Buffer.byteLength(script, 'utf-8')} bytes]`
    }
    return `<script> [${Buffer.byteLength(script, 'utf-8')} bytes]`
}
