import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import type { remote } from 'webdriver'

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
        isMultiremote: false,
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
