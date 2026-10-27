import { SENSITIVE_DATA_REPLACER } from '@wdio/logger'
import type { Options } from '@wdio/types'

import { getBrowserObject } from './utils.js'
import { WDIO_CHAINABLE, getWdioKind } from './kind.js'
import { isInCommandHook } from './shim.js'

const MAX_STRING_LENGTH = 1024
const MAX_ITEMS = 50
const MAX_DEPTH = 4
// a copy never makes the command fail
const UNREADABLE = '<unreadable>'
// their result is base64 and reporters get them from the protocol events
const NO_EVENT_COMMANDS = ['takeScreenshot', 'takeElementScreenshot']
// they only run the code of the caller, so the commands in it are outer commands
const TRANSPARENT_COMMANDS = ['call']

/**
 * The user command that the calling code runs in. `depth` is 0 for the outer
 * call. `id` is set only when the outer call sends events.
 * @experimental
 */
export interface UserCommandFrame {
    depth: number
    id?: number
}

/**
 * @experimental
 */
export interface UserCommandStore {
    getStore(): UserCommandFrame | undefined
    run<T>(frame: UserCommandFrame, fn: () => T): T
}

interface EventBrowser {
    sessionId?: string
    isBidi?: boolean
    isMultiRemote?: boolean
    options?: Pick<Options.Testrunner, 'userCommandEvents'>
    emit?: (event: string, payload: unknown) => unknown
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
 * The id of the outer user command that sends events, for the `parent` of a
 * protocol event. A command hook has no parent.
 * @experimental
 */
export function currentUserCommandId (): number | undefined {
    return isInCommandHook() ? undefined : userCommandStore?.getStore()?.id
}

/**
 * Run `fn` one level deeper with no event: the user commands that a custom
 * command runs send nothing.
 * @experimental
 */
export function runNested<T> (fn: () => T): T {
    const frame = userCommandStore?.getStore()
    // no frame (a multi-remote custom command): the instance commands send their own events
    if (!userCommandStore || !frame) {
        return fn()
    }
    return userCommandStore.run({ depth: frame.depth + 1, id: frame.id }, fn)
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
    const frame = userCommandStore.getStore()
    return userCommandStore.run({ depth: (frame?.depth ?? 0) + 1 }, fn)
}

function sendsEvents (browser: EventBrowser | undefined, command: string) {
    if (!browser?.isBidi || typeof browser.emit !== 'function' || isInCommandHook() || NO_EVENT_COMMANDS.includes(command)) {
        return false
    }
    const option = browser.options?.userCommandEvents
    if (option === false) {
        return false
    }
    return !(typeof option === 'object' && option.exclude?.includes(command))
}

/**
 * Run a user command. The outer call of a registered command sends a
 * `userCommand` and a `userResult` event in a WebDriver BiDi session.
 * @experimental
 */
export async function runUserCommand<T> (scope: unknown, command: string, args: unknown[], run: () => Promise<T>): Promise<T> {
    if (!userCommandStore || !userCommandNames.has(command) || TRANSPARENT_COMMANDS.includes(command)) {
        return run()
    }

    const parent = userCommandStore.getStore()
    if (parent) {
        return userCommandStore.run({ depth: parent.depth + 1, id: parent.id }, run)
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
    if (!userCommandStore || userCommandStore.getStore()) {
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

    // an outer call that sends nothing still is depth 0, so its nested calls send nothing
    if (!sendsEvents(browser, command)) {
        return store.run({ depth: 0 }, run)
    }

    const emit = browser!.emit!.bind(browser)
    const event = {
        id: ++lastUserCommandId, command, body: userCommandBody(args), protocol: 'bidi' as const,
        // a multi-remote browser has no session: each instance sends its own
        ...(browser!.sessionId ? { sessionId: browser!.sessionId } : {})
    }
    const sendValue = (value: unknown) => emit('userResult', { ...event, result: { value: shortCopy(value) } })
    const sendError = (error: unknown) => emit('userResult', { ...event, result: { error } })
    // the events are sent in the frame, so a listener that runs a command does not loop
    return store.run({ depth: 0, id: event.id }, () => {
        emit('userCommand', event)
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
        // a side chain: the caller keeps the result as it is (a chainable element, an element list)
        const sent = result.then(sendValue, sendError) as { catch?: (fn: () => void) => unknown }
        // a listener that throws must not make an unhandled rejection
        sent.catch?.(() => {})
        return result
    })
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

function wdioLabel (value: object, name: string, ref: unknown) {
    // a chainable element gives a promise for each property
    if ((value as { [WDIO_CHAINABLE]?: boolean })[WDIO_CHAINABLE]) {
        return `WebdriverIO.${name}`
    }
    return typeof ref === 'string' && ref ? `WebdriverIO.${name}<${ref}>` : `WebdriverIO.${name}`
}

/**
 * A copy of `value` that is small and safe to send: no binary data, long
 * strings cut, at most 50 items and 4 levels, WebdriverIO objects and functions
 * as a name, cycles as `[Circular]`.
 * @experimental
 */
export function shortCopy (value: unknown): unknown {
    try {
        return copyValue(value, new Set(), 0)
    } catch {
        return UNREADABLE
    }
}

function copyValue (value: unknown, ancestors: Set<object>, depth: number): unknown {
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
        return wdioLabel(value as object, 'Element', elem.elementId || elem.selector)
    }
    if (kind === 'element-array') {
        return wdioLabel(value as object, 'ElementArray', (value as { selector?: unknown }).selector)
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
    if (ancestors.has(value as object)) {
        return '[Circular]'
    }
    if (depth >= MAX_DEPTH) {
        return '[…]'
    }

    ancestors.add(value as object)
    const copyItem = (item: unknown) => copyValue(item, ancestors, depth + 1)
    let copy: unknown
    if (Array.isArray(value)) {
        copy = value.slice(0, MAX_ITEMS).map(copyItem)
        if (value.length > MAX_ITEMS) {
            (copy as unknown[]).push(`… [${value.length - MAX_ITEMS} more]`)
        }
    } else {
        const entries = Object.entries(value as object)
        copy = Object.fromEntries(entries.slice(0, MAX_ITEMS).map(([key, item]) => [key, copyItem(item)]))
        if (entries.length > MAX_ITEMS) {
            (copy as Record<string, unknown>)['…'] = `[${entries.length - MAX_ITEMS} more]`
        }
    }
    ancestors.delete(value as object)
    return copy
}
