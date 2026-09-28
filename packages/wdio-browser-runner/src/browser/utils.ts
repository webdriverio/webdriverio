/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'
import { isSourceMapRequest } from '@wdio/utils'
import type { local } from 'webdriver'

export function createBrowserEventEmitter() {
    const emitter = new EventEmitter()
    const emit = emitter.emit.bind(emitter)
    const sourceMapRequests = new Set<string>()
    emitter.emit = (event, ...args) => {
        if (
            event === 'network.beforeRequestSent' ||
            event === 'network.responseStarted' ||
            event === 'network.responseCompleted' ||
            event === 'network.fetchError'
        ) {
            // SAFETY: parseBidiMessage emits network events with NetworkBaseParameters.
            const params = args[0] as local.NetworkBeforeRequestSentParameters
            if (event === 'network.beforeRequestSent' && isSourceMapRequest(params.initiator)) {
                sourceMapRequests.add(params.request.request)
            }
            if (sourceMapRequests.has(params.request.request)) {
                if (event === 'network.responseCompleted' || event === 'network.fetchError') {
                    sourceMapRequests.delete(params.request.request)
                }
                // Node owns these synchronous requests; the page receives them after they finish.
                return false
            }
        }
        return emit(event, ...args)
    }
    return emitter
}

/**
 * Absolute files are imported through Vite's `/@fs/` prefix so the browser
 * requests a module URL rather than a bare filesystem path.
 */
export function toViteFsUrl (file: string) {
    if (file.startsWith('/@fs/') || file.startsWith('http://') || file.startsWith('https://')) {
        return file
    }
    const normalized = file.replace(/\\/g, '/')
    const absolute = normalized.startsWith('/') ? normalized.slice(1) : normalized
    return `/@fs/${absolute}`
}

export function getCID() {
    const urlParamString = new URLSearchParams(window.location.search)
    const cid = (
        // initial request contains cid as query parameter
        urlParamString.get('cid') ||
        // if not provided check for document cookie, set by `@wdio/runner` package
        (document.cookie.split(';') || [])
            .find((c) => c.includes('WDIO_CID'))
            ?.trim()
            .split('=')
            .pop()
    )

    if (!cid) {
        throw new Error('"cid" query parameter is missing')
    }

    return cid
}

export const showPopupWarning = <T>(name: string, value: T, defaultValue?: T) => (...params: any[]) => {
    const formatedParams = params.map(p => JSON.stringify(p)).join(', ')

    console.warn(`WebdriverIO encountered a \`${name}(${formatedParams})\` call that it cannot handle by default, so it returned \`${value}\`. Read more in https://webdriver.io/docs/runner#limitations.
  If needed, mock the \`${name}\` call manually like:
  \`\`\`
  import { spyOn } from "@wdio/browser-runner"
  spyOn(window, "${name}")${defaultValue ? `.mockReturnValue(${JSON.stringify(defaultValue)})` : ''}
  ${name}(${formatedParams})
  expect(${name}).toHaveBeenCalledWith(${formatedParams})
  \`\`\``)
    return value
}

export function sanitizeConsoleArgs(args: unknown[]) {
    return args.map((arg: any) => {
        if (arg === undefined) {
            return 'undefined'
        }
        try {
            if (arg && typeof arg.selector === 'string' && arg.error) {
                return `WebdriverIO.Element<"${arg.selector}">`
            }
            if (arg && typeof arg.selector === 'string' && typeof arg.length === 'number') {
                return `WebdriverIO.ElementArray<${arg.length}x "${arg.selector}">`
            }
            if (arg && typeof arg.selector === 'string') {
                return `WebdriverIO.Element<"${arg.selector}">`
            }
            if (arg && typeof arg.sessionId === 'string') {
                return `WebdriverIO.Browser<${arg.capabilities.browserName}>`
            }
        } catch {
            // ignore
        }

        if (
            arg instanceof HTMLElement ||
            (arg && typeof arg === 'object' && typeof arg.then === 'function') ||
            typeof arg === 'function'
        ) {
            return arg.toString()
        }
        if (arg instanceof Error) {
            return arg.stack
        }
        return arg
    })
}

const pick = (keys: string[], obj: any) => {
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k]) => keys.includes(k))
    )
}

const RELEVANT_TEST_PROPS = ['type', 'title', 'body', 'async', 'sync', 'timedOut', 'pending', 'parent', 'test']

/**
 * Filter test argument to only contain relevant information
 * @param arg hook parameter that may contain a test object from Mocha or Jasmine
 * @param file file path of the test
 * @returns test object with only relevant information
 */
export function filterTestArgument(arg: any, file: string): any {
    if (!arg) {
        return arg
    }

    const newArgs = pick(RELEVANT_TEST_PROPS, arg) as any
    return {
        ...newArgs,
        file: arg.file || file,
        test: filterTestArgument(newArgs.test, file),
        parent: filterTestArgument(newArgs.parent, file),
    }
}
