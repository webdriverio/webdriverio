/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Workers } from '@wdio/types'
import { setWdioKind } from '@wdio/utils'

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

/**
 * The result of a command that ran in the worker. JSON drops the `wdio.kind` brand
 * of a mock or a browsing context (see `@wdio/utils` `kind.ts`), so set it again,
 * for example for the name in the timeout message of an assertion.
 */
export function commandResult (value: Workers.CommandResponseEvent): unknown {
    const { result, kind } = value
    return kind && result && typeof result === 'object' ? setWdioKind(result, kind) : result
}

/**
 * Keep the network intercepts this page registered in
 * `window.__wdioNetworkIntercepts__`. A request matching one of them is paused
 * until the page releases it, so the page must not wait for one synchronously.
 */
export function trackNetworkIntercepts (bidiPrototype: PropertyDescriptorMap) {
    const intercepts = new Set<string | symbol>()
    window.__wdioNetworkIntercepts__ = intercepts

    const addIntercept = bidiPrototype.networkAddIntercept?.value
    const removeIntercept = bidiPrototype.networkRemoveIntercept?.value
    if (typeof addIntercept !== 'function' || typeof removeIntercept !== 'function') {
        return
    }

    bidiPrototype.networkAddIntercept = {
        value: async function (this: unknown, ...args: unknown[]) {
            /**
             * the intercept pauses requests before its id gets back to the page
             */
            const pending = Symbol('pending intercept')
            intercepts.add(pending)
            try {
                const result = await addIntercept.apply(this, args)
                if (result?.intercept) {
                    intercepts.add(result.intercept)
                }
                return result
            } finally {
                intercepts.delete(pending)
            }
        }
    }
    bidiPrototype.networkRemoveIntercept = {
        value: async function (this: unknown, params: { intercept: string }, ...args: unknown[]) {
            try {
                return await removeIntercept.apply(this, [params, ...args])
            } finally {
                intercepts.delete(params?.intercept)
            }
        }
    }
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
