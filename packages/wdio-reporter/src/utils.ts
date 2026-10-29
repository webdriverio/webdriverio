import path from 'node:path'
import url from 'node:url'

import supportsColor from './supportsColor.js'
import { COLORS } from './constants.js'
import type { HookKind } from './types.js'
import type { Output, UserCommandOutput, UserResultOutput } from './stats/test.js'

const FIRST_FUNCTION_REGEX = /function (\w+)/

/**
 * The `error` of a `userResult` for a JSON report: `{ name, message }` for an object with a string `message`
 * (also an error from another realm, which `JSON.stringify` writes as `{}`), else the value as it is.
 * @experimental the name and the rule may change
 */
export function userCommandError(error: unknown): unknown {
    if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
        const { name, message } = error as { name?: unknown, message: string }
        return { name, message }
    }
    return error
}

/**
 * A `JSON.stringify` replacer for a report of `TestStats.output`: the error of a `userResult` gets its name and
 * message (see `userCommandError`), and each user command entry and protocol command entry that a user command
 * runs gets its one-line `text` (see `userCommandTexts`). Other values stay as they are.
 * @experimental the name and the rule may change
 */
export function userOutputReplacer(this: unknown, key: string, value: unknown): unknown {
    if ((this as { type?: unknown } | undefined)?.type === 'userResult' && key === 'result' && value && typeof value === 'object' && 'error' in value) {
        return { error: userCommandError((value as { error: unknown }).error) }
    }
    if (key === 'output' && Array.isArray(value) && value.some((entry) => entry && isUserCommandOutput(entry))) {
        const texts = userCommandTexts(value)
        return value.map((entry) => texts.has(entry) ? { ...entry, text: texts.get(entry) } : entry)
    }
    return value
}

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
 * a URL that names no path stays as it is, so that a reporter does not fail; `@wdio/utils` has
 * the same conversion, but the CommonJS build of a reporter cannot load it
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
 * the path of a spec file from the working folder, to show it; `undefined` for a file outside it
 * (a prefix search would cut `/app/application/…` with the working folder `/app`); path.relative
 * also matches another drive letter case and `/` on Windows
 */
export function relativeSpecFile(file: string, cwd = process.cwd()): string | undefined {
    const relative = path.isAbsolute(file) ? path.relative(cwd, file) : ''
    return relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)
        ? relative
        : undefined
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

/**
 * `true` for a user command entry of `TestStats.output`
 * @experimental the name may change
 */
export function isUserCommandOutput(entry: { type: string }): entry is UserCommandOutput {
    return entry.type === 'userCommand'
}

/**
 * `true` for a user command result entry of `TestStats.output`
 * @experimental the name may change
 */
export function isUserResultOutput(entry: { type: string }): entry is UserResultOutput {
    return entry.type === 'userResult'
}

// longest arguments in a user command title and longest inline result
const TITLE_ARGS_LENGTH = 120
const INLINE_RESULT_LENGTH = 60
// commands whose result is a handle or a helper, not data
const NO_DATA_COMMANDS = ['newWindow', 'emulate', 'addInitScript', 'debug', 'getPuppeteer']
// commands whose result is a window handle: not shown in a title, the id means nothing to a reader
const HANDLE_COMMANDS = ['getWindowHandle', 'getWindowHandles', 'createWindow', 'closeWindow', 'switchWindow']
const ELEMENT_REFERENCE_KEY = 'element-6066-11e4-a52e-4f735466cecf'

function cut(text: string, length: number) {
    return text.length > length ? `${text.slice(0, length)}…` : text
}

function resultValue(result: unknown): unknown {
    return result && typeof result === 'object' && 'value' in result ? (result as { value: unknown }).value : result
}

function isPlaceholder(value: unknown) {
    return typeof value === 'string' && value.startsWith('WebdriverIO.') && !value.startsWith('WebdriverIO.Element')
}

function isElementReference(value: unknown) {
    return Boolean(value) && typeof value === 'object' && ELEMENT_REFERENCE_KEY in (value as object)
}

function formatArgument(arg: unknown) {
    const fn = typeof arg === 'string' && /^\[Function (.*)\]$/.exec(arg)
    if (fn) {
        return `function ${fn[1]}`
    }
    // an element argument: its query, as in the test code
    const elem = typeof arg === 'string' && /^WebdriverIO\.Element(Array)?(?:<(.*)>)?(?: \(.*\))?$/.exec(arg)
    if (elem) {
        return elem[2] !== undefined ? `$${elem[1] ? '$' : ''}(${JSON.stringify(elem[2])})` : 'Element'
    }
    return JSON.stringify(arg)
}

/**
 * The title of a user command as in the test code, e.g. `$("#btn")` or `setValue("**MASKED**", {"mask":true})`:
 * functions as `function name`, element arguments as their query, arguments cut at 120 characters.
 * @experimental the name and the format may change
 */
export function userCommandTitle(command: string, body: unknown): string {
    if (!Array.isArray(body)) {
        return command
    }
    return `${command}(${cut(body.map(formatArgument).join(', '), TITLE_ARGS_LENGTH)})`
}

/**
 * `true` when the title of a user command does not show all its arguments
 * @experimental the name may change
 */
export function userCommandTitleIsCut(title: string): boolean {
    return title.endsWith('…)')
}

/**
 * `true` for a result with no data: none, `null`, `{}`, a tab or mock placeholder, or the handle of
 * `newWindow`, `emulate`, `addInitScript`, `debug` or `getPuppeteer`
 * @experimental the name and the rule may change
 */
export function isNoDataResult(result: unknown, command?: string): boolean {
    if (command && NO_DATA_COMMANDS.includes(command)) {
        return true
    }
    const value = resultValue(result)
    return value === undefined || value === null
        || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
        || isPlaceholder(value)
        || (Array.isArray(value) && value.length > 0 && value.every(isPlaceholder))
}

/**
 * The result of a command for its title, e.g. `"Hello"`, `found`, `3 found`, `not found` (cut at 60 characters).
 * `undefined` for an error, a result with no data or a window handle; a list of tabs gives their number.
 * @experimental the name and the format may change
 */
export function inlineResult(result: unknown, command?: string): string | undefined {
    if ((result && typeof result === 'object' && 'error' in result) || (command && HANDLE_COMMANDS.includes(command))) {
        return undefined
    }
    const value = resultValue(result)
    if (Array.isArray(value) && value.length > 0 && value.every((v) => v === 'WebdriverIO.BrowsingContext')) {
        return String(value.length)
    }
    if (isNoDataResult(result, command)) {
        return undefined
    }
    if (isElementReference(value)) {
        return 'found'
    }
    // an empty list is a list of elements only for an element query
    if (Array.isArray(value) && (value.length > 0 || /^findElements/.test(command ?? '')) && value.every(isElementReference)) {
        return `${value.length} found`
    }
    if (typeof value === 'string') {
        if (/^WebdriverIO\.Element(?:<.*>)? \(not found\)$/.test(value)) {
            return 'not found'
        }
        if (/^WebdriverIO\.Element(?:<.*>)? \(id .*\)$/.test(value)) {
            return 'found'
        }
        const many = /^WebdriverIO\.ElementArray(?:<.*>)? \((\d+)\)$/.exec(value)
        if (many) {
            return `${many[1]} found`
        }
        if (/^<Buffer \d+ bytes>$/.test(value)) {
            return value
        }
    }
    return cut(JSON.stringify(value), INLINE_RESULT_LENGTH)
}

/**
 * A WebDriver request with no session id and no element or shadow root id, e.g. `GET /element/:elementId/text`
 * @experimental the name and the format may change
 */
export function compactRequest(method: string, endpoint: string): string {
    const path = endpoint.replace(/^\/session\/[^/]+/, '').replace(/\/(element|shadow)\/[^/]+/g, '/$1/:$1Id')
    return `${method.toUpperCase()} ${path || '/'}`
}

/**
 * The path of a WebDriver request with the session id in place of `:sessionId`
 * @experimental the name may change
 */
export function resolvedPath(endpoint: string, sessionId?: string): string {
    return sessionId ? endpoint.replace(':sessionId', sessionId) : endpoint
}

/**
 * The one-line text of each user command entry and of each protocol command entry that a user command runs
 * (an entry with `parent`): `getText() → "clicked"`, `getElementText → "clicked"  GET /element/:elementId/text`.
 * Other entries get no text, so a report of a WebDriver Classic session does not change.
 * @experimental the name and the format may change
 */
export function userCommandTexts(output: ReadonlyArray<{ type: string }>): Map<object, string> {
    const texts = new Map<object, string>()
    const used = new Set<object>()
    output.forEach((entry, index) => {
        if (isUserCommandOutput(entry)) {
            const title = userCommandTitle(entry.command, entry.body)
            const end = output.slice(index + 1).find((e) => isUserResultOutput(e) && e.id === entry.id) as UserResultOutput | undefined
            const inline = end && inlineResult(end.result, entry.command)
            texts.set(entry, inline ? `${title} → ${inline}` : title)
            return
        }
        const command = entry as Partial<Output>
        if (entry.type !== 'command' || command.parent === undefined) {
            return
        }
        const end = output.slice(index + 1).find((e) => {
            const r = e as Partial<Output>
            return e.type === 'result' && !used.has(e) && r.parent === command.parent && r.command === command.command
        })
        if (end) {
            used.add(end)
        }
        const inline = end && inlineResult((end as Partial<Output>).result, command.command)
        const request = command.method && command.endpoint ? `  ${compactRequest(command.method, command.endpoint)}` : ''
        texts.set(entry, `${command.command}${inline ? ` → ${inline}` : ''}${request}`)
    })
    return texts
}
