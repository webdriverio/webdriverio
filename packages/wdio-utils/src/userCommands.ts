import { SENSITIVE_DATA_REPLACER } from '@wdio/logger'
import type { Options } from '@wdio/types'

import { getBrowserObject, transformCommandLogResult } from './utils.js'
import { WDIO_CHAINABLE, getWdioKind } from './kind.js'
import { isInCommandHook } from './shim.js'

const MAX_STRING_LENGTH = 1024
const MAX_ITEMS = 50
const MAX_DEPTH = 4
// a wide object stays small and fast: 20 times one level, so a normal result (a list of cookies) is whole
const MAX_VALUES = 1000
// a copy never makes the command fail
const UNREADABLE = '<unreadable>'
// their result is base64 and reporters get them from the protocol events
const NO_EVENT_COMMANDS = ['takeScreenshot', 'takeElementScreenshot']
// they only run the code of the caller, so the commands in it are outer commands
const TRANSPARENT_COMMANDS = ['call']

/**
 * The outer user command that the calling code runs in. `id` is set only when
 * the outer call sends events or is excluded.
 * @experimental
 */
export interface UserCommandFrame {
    id?: number
}

/**
 * @experimental
 */
export interface UserCommandStore {
    getStore(): UserCommandFrame | undefined
    run<T>(frame: UserCommandFrame | undefined, fn: () => T): T
}

/**
 * Internal: the monad sets it on a client, as `true` when the client has a listener of a user command event.
 */
export const HAS_USER_COMMAND_LISTENERS = Symbol('wdio.hasUserCommandListeners')
const USER_COMMAND_EVENTS = ['userCommand', 'userResult']

interface EventBrowser {
    sessionId?: string
    isBidi?: boolean
    isMobile?: boolean
    isMultiRemote?: boolean
    options?: Pick<Options.Testrunner, 'userCommandEvents'>
    capabilities?: unknown
    requestedCapabilities?: unknown
    emit?: (event: string, payload: unknown) => unknown
    listenerCount?: (event: string) => number
    [HAS_USER_COMMAND_LISTENERS]?: () => boolean
}

// no store (browser bundles): no events
let userCommandStore: UserCommandStore | undefined
const userCommandNames = new Set<string>()
let lastUserCommandId = 0

/**
 * Node entry points register an `AsyncLocalStorage`, so each concurrent test
 * has its own outer user command.
 * @experimental
 */
export function setUserCommandStore (store: UserCommandStore) {
    userCommandStore = store
}

/**
 * The commands that send `userCommand` / `userResult` events.
 * @experimental
 */
export function registerUserCommands (names: string[]) {
    for (const name of names) {
        userCommandNames.add(name)
    }
}

/**
 * The id of the outer user command that sends events or is excluded, for the `parent` of a
 * protocol event. A command hook has no parent.
 * @experimental
 */
export function currentUserCommandId (): number | undefined {
    return isInCommandHook() ? undefined : userCommandStore?.getStore()?.id
}

/**
 * The `parent` field of a protocol event: the id of the outer user command. A screenshot gets none, because
 * reporters take screenshots from its event.
 * @experimental
 */
export function userCommandParent (command: string): { parent?: number } {
    const id = NO_EVENT_COMMANDS.includes(command) ? undefined : currentUserCommandId()
    return id === undefined ? {} : { parent: id }
}

/**
 * Run `fn` so that no command in it sends events and has a parent id, for
 * example the commands of a reporter.
 * @experimental
 */
export function runWithoutUserCommands<T> (fn: () => T): T {
    if (!userCommandStore) {
        return fn()
    }
    return userCommandStore.run({}, fn)
}

/**
 * Run `fn` with no user command, also inside one: a command in it is an outer
 * call. For callbacks that a user command did not start, for example the
 * events of a socket that it opened.
 * @experimental
 */
export function runOutsideUserCommands<T> (fn: () => T): T {
    if (!userCommandStore?.getStore()) {
        return fn()
    }
    return userCommandStore.run(undefined, fn)
}

// 'hide': an id but no events (an excluded command, no listener), so opt-in reporters hide its protocol commands
function eventMode (browser: EventBrowser | undefined, command: string): 'send' | 'hide' | undefined {
    // Appium sessions are out of scope, also with WebDriver BiDi
    if (!browser?.isBidi || browser.isMobile || typeof browser.emit !== 'function' || isInCommandHook() || NO_EVENT_COMMANDS.includes(command)) {
        return undefined
    }
    const option = browser.options?.userCommandEvents
    // not set: on only with the `wdio:experimentalBiDiCommands` capability
    if (option === false || (option === undefined && !hasBidiCommandsFlag(browser))) {
        return undefined
    }
    return (typeof option === 'object' && option.exclude?.includes(command)) || !hasListeners(browser) ? 'hide' : 'send'
}

function hasBidiCommandsFlag (browser: EventBrowser) {
    const flag = 'wdio:experimentalBiDiCommands'
    return Boolean((browser.requestedCapabilities as Record<string, unknown> | undefined)?.[flag]
        || (browser.capabilities as Record<string, unknown> | undefined)?.[flag])
}

// with no listener, no copy is made
function hasListeners (browser: EventBrowser) {
    const check = browser[HAS_USER_COMMAND_LISTENERS]
    if (typeof check === 'function') {
        return check.call(browser)
    }
    const count = browser.listenerCount
    return typeof count !== 'function' || USER_COMMAND_EVENTS.some((event) => count.call(browser, event) > 0)
}

/**
 * Run a user command. The outer call of a registered command sends a
 * `userCommand` and a `userResult` event in a WebDriver BiDi session.
 * @experimental
 */
export function runUserCommand<T> (scope: unknown, command: string, args: unknown[], run: () => Promise<T>): Promise<T> {
    if (!userCommandStore || !userCommandNames.has(command) || TRANSPARENT_COMMANDS.includes(command)) {
        return run()
    }

    // a nested call runs in the frame of the outer call
    if (userCommandStore.getStore()) {
        return run()
    }
    return runOuterCommand(userCommandStore, scope, command, args, run)
}

/**
 * Run a custom command of `addCommand` / `overwriteCommand`. Its outer call is
 * a user command, and `run` is in its frame, so the old events of the custom
 * command get its id as `parent`.
 * @experimental
 */
export function runCustomCommand<T> (scope: unknown, command: string, args: unknown[], run: () => T): T {
    if (!userCommandStore || userCommandStore.getStore() || TRANSPARENT_COMMANDS.includes(command)) {
        return run()
    }
    return runOuterCommand(userCommandStore, scope, command, args, run)
}

function runOuterCommand<T> (store: UserCommandStore, scope: unknown, command: string, args: unknown[], run: () => T): T {
    const browser = scope ? getBrowserObject(scope as WebdriverIO.Browser) as EventBrowser : undefined
    // each instance of a multi-remote command is the outer call of its own session
    if ((scope as EventBrowser | undefined)?.isMultiRemote || browser?.isMultiRemote) {
        return run()
    }

    // an outer call that sends nothing still has a frame, so its nested calls send nothing
    const mode = eventMode(browser, command)
    if (mode !== 'send') {
        return store.run(mode === 'hide' ? { id: ++lastUserCommandId } : {}, run)
    }

    const emit = browser!.emit!.bind(browser)
    const event = {
        id: ++lastUserCommandId, command, body: userCommandBody(args), protocol: 'bidi' as const,
        // a multi-remote browser has no session: each instance sends its own
        ...(browser!.sessionId ? { sessionId: browser!.sessionId } : {})
    }
    // a listener that throws does not change the result of the command
    const send = (name: string, payload: object) => {
        try {
            emit(name, payload)
        } catch {
            // ignore
        }
    }
    const sendValue = (value: unknown) => send('userResult', { ...event, result: { value: shortCopy(value) } })
    const sendError = (error: unknown) => send('userResult', { ...event, result: { error } })
    // the events are sent in the frame, so a listener that runs a command does not loop
    return store.run({ id: event.id }, () => {
        send('userCommand', event)
        let result: T
        try {
            result = run()
        } catch (error) {
            sendError(error)
            throw error
        }
        if (!isPromiseLike(result)) {
            sendValue(result)
            return result
        }
        // one derived promise: a second reaction on the promise of the command cuts its async stack
        if (needsDerivedPromise(result)) {
            return result.then(
                (value) => {
                    sendValue(value)
                    return value
                },
                (error) => {
                    sendError(error)
                    throw error
                }
            ) as T
        }
        // a side chain: the caller keeps the result as it is (a chainable element, an element list)
        result.then(sendValue, sendError)
        return result
    })
}

/**
 * Internal: `true` for a native promise that is not a WebdriverIO value. A chainable element or an element list
 * (also pending) must reach the caller as it is.
 */
export function needsDerivedPromise (value: unknown): value is Promise<unknown> {
    return value instanceof Promise && getWdioKind(value) === undefined && !(value as { [WDIO_CHAINABLE]?: boolean })[WDIO_CHAINABLE]
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
    Boolean(value) && typeof (value as { then?: unknown }).then === 'function'

const isMaskOption = (value: unknown) => Boolean(value) && typeof value === 'object' && (value as { mask?: unknown }).mask === true

/**
 * The arguments of a user command for an event: masked text and short copies.
 * @experimental
 */
export function userCommandBody (args: unknown[]): unknown[] {
    let masked: boolean
    try {
        masked = isMaskOption(args[args.length - 1])
    } catch {
        // the mask option is unknown, so no value is sent
        return args.map(() => UNREADABLE)
    }
    return args.map((arg, i) => masked && i < args.length - 1 && (typeof arg === 'string' || typeof arg === 'number')
        ? SENSITIVE_DATA_REPLACER
        : shortCopy(arg))
}

function byteLength (text: string) {
    const buffer = (globalThis as { Buffer?: { byteLength(text: string): number } }).Buffer
    return buffer ? buffer.byteLength(text) : text.length
}

function isBuffer (value: unknown) {
    const buffer = (globalThis as { Buffer?: { isBuffer(value: unknown): boolean } }).Buffer
    return Boolean(buffer?.isBuffer(value))
}

function isPlainObject (value: unknown) {
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

function wdioLabel (value: object, name: string, ref: unknown) {
    // a chainable element gives a promise for each property
    if ((value as { [WDIO_CHAINABLE]?: boolean })[WDIO_CHAINABLE]) {
        return `WebdriverIO.${name}`
    }
    return typeof ref === 'string' && ref ? `WebdriverIO.${name}<${ref}>` : `WebdriverIO.${name}`
}

/**
 * A copy of `value` that is small and safe to send: no binary data, long
 * strings cut, at most 50 items, 4 levels and 1000 values, WebdriverIO objects and functions
 * as a name, cycles as `[Circular]`.
 * @experimental
 */
export function shortCopy (value: unknown): unknown {
    try {
        return copyValue(value, { ancestors: new Set(), values: 0 }, 0)
    } catch {
        return UNREADABLE
    }
}

interface CopyState {
    ancestors: Set<object>
    values: number
}

function copyValue (value: unknown, state: CopyState, depth: number): unknown {
    state.values++
    if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string') {
        return value.length > MAX_STRING_LENGTH
            ? `${value.slice(0, MAX_STRING_LENGTH)}… [${byteLength(value)} bytes]`
            : value
    }
    if (typeof value === 'bigint' || typeof value === 'symbol') {
        return String(value)
    }

    const kind = getWdioKind(value)
    if (kind === 'element') {
        const elem = value as { elementId?: unknown, selector?: unknown }
        // the selector, then the id or "not found"
        const label = wdioLabel(value as object, 'Element', elem.selector)
        if ((value as { [WDIO_CHAINABLE]?: boolean })[WDIO_CHAINABLE]) {
            return label
        }
        return elem.elementId ? `${label} (id ${String(elem.elementId)})` : `${label} (not found)`
    }
    if (kind === 'element-array') {
        const label = wdioLabel(value as object, 'ElementArray', (value as { selector?: unknown }).selector)
        return Array.isArray(value) ? `${label} (${value.length})` : label
    }
    if (kind === 'browser') {
        return 'WebdriverIO.Browser'
    }
    if (kind === 'mock') {
        return 'WebdriverIO.Mock'
    }
    if (kind === 'browsing-context') {
        return 'WebdriverIO.BrowsingContext'
    }

    if (typeof value === 'function') {
        return `[Function ${value.name || 'anonymous'}]`
    }
    if (isBuffer(value)) {
        return `<Buffer ${(value as Uint8Array).byteLength} bytes>`
    }
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
        return `<${Object.prototype.toString.call(value).slice(8, -1)} ${value.byteLength} bytes>`
    }
    if (value instanceof Map || value instanceof Set) {
        return `${value instanceof Map ? 'Map' : 'Set'}(${value.size})`
    }
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
    }
    if (value instanceof Error) {
        return { name: value.name, message: value.message }
    }
    if (typeof (value as { then?: unknown }).then === 'function') {
        return '[Promise]'
    }
    if (state.ancestors.has(value as object)) {
        return '[Circular]'
    }
    if (depth >= MAX_DEPTH) {
        return '[…]'
    }
    // the same placeholders as the command log; only these keys can change the object
    const source = isPlainObject(value) && (Object.hasOwn(value as object, 'file') || Object.hasOwn(value as object, 'script'))
        ? transformCommandLogResult(value)
        : value
    if (typeof source === 'string') {
        return source
    }

    state.ancestors.add(value as object)
    let copy: unknown
    if (Array.isArray(value)) {
        const items: unknown[] = []
        for (let i = 0; i < Math.min(value.length, MAX_ITEMS) && state.values < MAX_VALUES; i++) {
            items.push(copyValue(value[i], state, depth + 1))
        }
        if (value.length > items.length) {
            items.push(`… [${value.length - items.length} more]`)
        }
        copy = items
    } else {
        // keys first: a getter of a key that is not kept does not run
        const keys = Object.keys(source as object)
        const object = source as Record<string, unknown>
        const entries: [string, unknown][] = []
        for (let i = 0; i < Math.min(keys.length, MAX_ITEMS) && state.values < MAX_VALUES; i++) {
            entries.push([keys[i], copyValue(object[keys[i]], state, depth + 1)])
        }
        if (keys.length > entries.length) {
            entries.push(['…', `[${keys.length - entries.length} more]`])
        }
        copy = Object.fromEntries(entries)
    }
    state.ancestors.delete(value as object)
    return copy
}
