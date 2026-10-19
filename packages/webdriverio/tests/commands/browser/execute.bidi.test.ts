import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import { BIDI_SCRIPT_TIMEOUT, ELEMENT_KEY, type remote } from 'webdriver'
import { setWdioKind } from '@wdio/utils'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager () {
        return {
            getCurrentContext: async () => 'ctx-1'
        }
    }
}))

const { execute } = await import('../../../src/commands/browser/execute.js')
const { LocalValue } = await import('../../../src/utils/bidi/value.js')

function bidiBrowser (scriptArgs: unknown[] = []) {
    const scriptCallFunction = vi.fn(async (params: remote.ScriptCallFunctionParameters) => {
        const fn = new Function(`return (${params.functionDeclaration})`)() as (...args: unknown[]) => Promise<unknown>
        const raw = await fn(...scriptArgs)
        return {
            type: 'success',
            realm: 'realm-1',
            result: LocalValue.getArgument(raw).asMap()
        }
    })

    return {
        isBidi: true,
        isMultiRemote: false,
        scriptCallFunction
    }
}

describe('execute BiDi blob results', () => {
    it('returns a Blob from the function sent to scriptCallFunction', async () => {
        const browser = bidiBrowser()

        const result = await execute.call(
            browser as unknown as WebdriverIO.Browser,
            () => new Blob(['Hello World'], { type: 'text/plain' })
        )

        expect(browser.scriptCallFunction).toHaveBeenCalledTimes(1)
        const params = browser.scriptCallFunction.mock.calls[0][0]
        expect(params.awaitPromise).toBe(true)
        expect(params.target).toEqual({ context: 'ctx-1' })
        expect(params.arguments).toEqual([])
        expect(params.functionDeclaration).toContain('__wdioSerializeValue')

        expect(result).toBeInstanceOf(Blob)
        expect(result.type).toBe('text/plain')
        expect(result.size).toBe(11)
        expect(await result.text()).toBe('Hello World')
    })

    it('passes script arguments into the BiDi function', async () => {
        const browser = bidiBrowser(['Hello World'])

        const result = await execute.call(
            browser as unknown as WebdriverIO.Browser,
            (text: string) => new Blob([text], { type: 'text/plain' }),
            'Hello World'
        )

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument('Hello World').asMap()
        ])
        expect(await result.text()).toBe('Hello World')
    })

    it('awaits an async function and a string script', async () => {
        const asyncBrowser = bidiBrowser()
        const asyncResult = await execute.call(
            asyncBrowser as unknown as WebdriverIO.Browser,
            async () => {
                await Promise.resolve()
                return new Blob(['async'], { type: 'text/plain' })
            }
        )
        expect(await asyncResult.text()).toBe('async')

        const stringBrowser = bidiBrowser()
        const stringResult = await execute.call(
            stringBrowser as unknown as WebdriverIO.Browser,
            'return new Blob(["from-string"], { type: "text/plain" })'
        ) as Blob
        expect(await stringResult.text()).toBe('from-string')
    })
})

describe('execute BiDi script timeout', () => {
    const scriptTimeoutBrowser = (capabilities: Record<string, unknown>, getTimeouts?: () => Promise<unknown>) => ({
        isBidi: true,
        isMultiRemote: false,
        sessionId: 'session-1',
        capabilities,
        ...(getTimeouts ? { getTimeouts } : {}),
        scriptCallFunction: vi.fn(async () => ({ type: 'success', realm: 'realm-1', result: { type: 'undefined' } }))
    })
    const sentScriptTimeout = (browser: ReturnType<typeof scriptTimeoutBrowser>) =>
        (browser.scriptCallFunction.mock.calls[0] as unknown as [Record<symbol, unknown>])[0][BIDI_SCRIPT_TIMEOUT]

    /**
     * the transport starts the time when it sends the command, so command hooks do not count
     */
    it('gives the BiDi command the script timeout of the session', async () => {
        const browser = scriptTimeoutBrowser({ timeouts: { script: 2_000 } })
        await execute.call(browser as unknown as WebdriverIO.Browser, () => 1)
        expect(sentScriptTimeout(browser)).toBe(2_000)
    })

    it('uses the script timeout of an attached session', async () => {
        const browser = scriptTimeoutBrowser({}, async () => ({ script: 60_000 }))
        await execute.call(browser as unknown as WebdriverIO.Browser, () => 1)
        expect(sentScriptTimeout(browser)).toBe(60_000)
    })

    it('sets no script timeout for a null one', async () => {
        const browser = scriptTimeoutBrowser({ timeouts: { script: null } })
        await execute.call(browser as unknown as WebdriverIO.Browser, () => 1)
        expect(sentScriptTimeout(browser)).toBeUndefined()
    })

    /**
     * the transport starts no timer for a value that a timer cannot hold
     */
    it('passes a very long script timeout on as it is', async () => {
        const browser = scriptTimeoutBrowser({ timeouts: { script: Number.MAX_SAFE_INTEGER } })
        await execute.call(browser as unknown as WebdriverIO.Browser, () => 1)
        expect(sentScriptTimeout(browser)).toBe(Number.MAX_SAFE_INTEGER)
    })
})

describe('execute BiDi element arguments', () => {
    /**
     * an element has commands, so it is not a plain object for the serializer
     */
    const element = (props: Record<string, unknown>) => setWdioKind({ ...props, addCommand () {} }, 'element')

    it('passes an element as its reference', async () => {
        const browser = bidiBrowser()
        await execute.call(browser as unknown as WebdriverIO.Browser, (el: HTMLElement) => el, element({ selector: '.found', elementId: 'el-1', [ELEMENT_KEY]: 'el-1' }) as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument({ [ELEMENT_KEY]: 'el-1' }).asMap()
        ])
    })

    it('throws that an element that was not found can not be passed, as in Classic', async () => {
        const browser = bidiBrowser()
        const missing = element({ selector: '.missing', error: new Error('no such element') })

        await expect(execute.call(browser as unknown as WebdriverIO.Browser, (el: HTMLElement) => el, missing as never))
            .rejects.toThrow('The element with selector ".missing" you are trying to pass into the execute method wasn\'t found')
        expect(browser.scriptCallFunction).not.toHaveBeenCalled()
    })
})

/**
 * W3C "get a known element": an element argument that the page removed is stale, as in
 * Classic Execute Script. BiDi still resolves the removed node.
 */
describe('execute BiDi stale element arguments', () => {
    const element = (elementId: string) => setWdioKind({ selector: '#el', elementId, [ELEMENT_KEY]: elementId, addCommand () {} }, 'element')
    const page: Record<string, unknown> = {}
    page.defaultView = { document: page }
    const inPage = { isConnected: true, ownerDocument: page, nodeType: 1, id: 'in-page' }
    const removed = { isConnected: false, ownerDocument: page, nodeType: 1, id: 'removed' }
    const oldDocument: Record<string, unknown> = { defaultView: { document: {} } }
    const ofOldDocument = { isConnected: true, ownerDocument: oldDocument, nodeType: 1, id: 'old' }

    it.each([
        ['an argument', [removed], [element('removed')]],
        ['an argument after others', ['text', removed], ['text', element('removed')]],
        ['an argument in an array', [[inPage, removed]], [[element('in-page'), element('removed')]]],
        ['an argument in an object', [{ list: removed }], [{ list: element('removed') }]],
        ['an argument of an old document', [ofOldDocument], [element('old')]]
    ])('throws a stale element error for %s', async (_, pageArgs, args) => {
        const browser = bidiBrowser(pageArgs)
        const script = vi.fn((...values: unknown[]) => values.length)

        await expect(execute.call(browser as unknown as WebdriverIO.Browser, script as never, ...(args as never[])))
            .rejects.toThrow('stale element reference')
    })

    it('throws a stale element error for a string script', async () => {
        const browser = bidiBrowser([removed])

        await expect(execute.call(browser as unknown as WebdriverIO.Browser, 'return arguments[0].id', element('removed') as never))
            .rejects.toThrow('stale element reference')
    })

    it('runs the script with an element that is in the page', async () => {
        const browser = bidiBrowser([[inPage], { el: inPage }, 'text'])

        expect(await execute.call(browser as unknown as WebdriverIO.Browser, ((list: { id: string }[], obj: { el: { id: string } }, text: string) => `${list[0].id} ${obj.el.id} ${text}`) as never, [element('in-page')] as never, { el: element('in-page') } as never, 'text' as never))
            .toBe('in-page in-page text')
    })

    it('sends a script without element arguments unchanged', async () => {
        const browser = bidiBrowser([1])
        await execute.call(browser as unknown as WebdriverIO.Browser, ((n: number) => n) as never, 1 as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].functionDeclaration).not.toContain('stale element reference')
    })
})
