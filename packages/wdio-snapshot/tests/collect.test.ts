import { describe, expect, it, vi } from 'vitest'

import { roleTable } from '@wdio/utils'
import { collectScript, collectWeb } from '../src/collect.js'
import { collectInPage } from '../src/web.js'

const RESULT = { tree: { role: 'document', children: [] }, counter: 3 }
const OPTS = { counter: 0, all: false, boxes: false } satisfies Parameters<typeof collectWeb>[1]

function context () {
    return {
        execute: vi.fn().mockResolvedValue(RESULT),
        executeScript: vi.fn().mockResolvedValue(RESULT)
    } as unknown as WebdriverIO.Browser & { execute: ReturnType<typeof vi.fn>, executeScript: ReturnType<typeof vi.fn> }
}

describe('collectWeb', () => {
    it('sends the options as one JSON string over BiDi', async () => {
        const browser = context()
        const result = await collectWeb(browser, { ...OPTS, counter: 7 }, { transport: 'bidi' })
        expect(result).toBe(RESULT)
        const [script, ...args] = browser.execute.mock.calls[0]
        expect(typeof script).toBe('string')
        expect(script).toContain('JSON.parse(arguments[0])')
        expect(args).toHaveLength(1)
        expect(typeof args[0]).toBe('string')
        const parsed = JSON.parse(args[0])
        expect(parsed.counter).toBe(7)
        expect(parsed.assignRefs).toBe(true)
        expect(parsed.roles).toEqual(JSON.parse(JSON.stringify(roleTable())))
        expect(Array.isArray(parsed.knownRoles)).toBe(true)
        expect(browser.executeScript).not.toHaveBeenCalled()
    })

    it('passes the scope as a real element next to the JSON string', async () => {
        const browser = context()
        const scope = { elementId: 'x' } as unknown as WebdriverIO.Element
        await collectWeb(browser, OPTS, { transport: 'classic-first', scope })
        const [, json, element] = browser.execute.mock.calls[0]
        expect(typeof json).toBe('string')
        expect(JSON.parse(json).assignRefs).toBe(true)
        expect(element).toBe(scope)
        expect(browser.executeScript).not.toHaveBeenCalled()
    })

    it('uses the classic endpoint first', async () => {
        const browser = context()
        await collectWeb(browser, OPTS, { transport: 'classic-first' })
        expect(browser.executeScript).toHaveBeenCalledTimes(1)
        expect(browser.execute).not.toHaveBeenCalled()
    })

    it('falls back to a JSON string over BiDi when the classic endpoint fails', async () => {
        const browser = context()
        browser.executeScript.mockRejectedValue(new Error('unsupported'))
        const result = await collectWeb(browser, OPTS, { transport: 'classic-first' })
        expect(result.classicUnavailable).toBe(true)
        expect(typeof browser.execute.mock.calls[0][1]).toBe('string')
    })
})

describe('collectScript', () => {
    it('is one expression that compiles and carries the role table as a JSON literal', () => {
        const script = collectScript({ counter: 2, all: false, boxes: false, assignRefs: 'ephemeral' })
        expect(() => new Function(`return ${script}`)).not.toThrow()
        expect(script).toMatch(/^\(function collectInPage/)
        expect(script).toContain('JSON.parse("')
        expect(script).not.toMatch(/__name|__spread|__async|__objRest/)
    })

    it('parses the same options and role table in the page', () => {
        const script = collectScript({ counter: 2, all: true, boxes: false, assignRefs: 'ephemeral', viewport: true })
        const literal = /JSON\.parse\((".*")\)\)$/.exec(script)![1]
        const parsed = JSON.parse(JSON.parse(literal))
        expect(parsed).toMatchObject({ counter: 2, all: true, assignRefs: 'ephemeral', viewport: true })
        expect(parsed.roles).toEqual(JSON.parse(JSON.stringify(roleTable())))
        expect(Array.isArray(parsed.knownRoles)).toBe(true)
    })
})

describe('selector providers in the collector', () => {
    const ui5 = { name: 'ui5', attributes: ['data-id'], candidates: '(el) => [`ui5:${el.id}`]' }

    it('embeds the provider source and sends its attributes in the JSON options', async () => {
        const browser = context()
        await collectWeb(browser, OPTS, { transport: 'bidi' }, [ui5])
        const [script, json] = browser.execute.mock.calls[0]
        expect(script).toContain('{name:"ui5",fn:((el) => [`ui5:${el.id}`])}')
        expect(JSON.parse(json).providerAttributes).toEqual([{ name: 'ui5', attr: 'data-id' }])
    })

    it('wraps method shorthand so it evaluates to the function', async () => {
        const browser = context()
        await collectWeb(browser, OPTS, { transport: 'classic-first' }, [{ name: 'ui5', candidates: 'candidates(el) { return [] }' }])
        expect(browser.executeScript.mock.calls[0][0]).toContain('{name:"ui5",fn:({candidates(el) { return [] }}).candidates}')
    })

    it('keeps the async prefix of method shorthand', () => {
        const script = collectScript({ counter: 0, all: false, boxes: false, assignRefs: true }, [{ name: 'ui5', candidates: 'async candidates(el) { return [] }' }])
        expect(script).toContain('fn:({async candidates(el) { return [] }}).candidates')
    })

    it('does not wrap an async arrow function', () => {
        const script = collectScript({ counter: 0, all: false, boxes: false, assignRefs: true }, [{ name: 'ui5', candidates: 'async (el) => []' }])
        expect(script).toContain('fn:(async (el) => [])')
        expect(script).not.toContain('({async')
    })

    it('keeps the classic and BiDi scripts unchanged without providers', async () => {
        const classic = `return (${collectInPage.toString()})(arguments[0])`
        const bidi = `return (${collectInPage.toString()})(JSON.parse(arguments[0]), arguments[1])`
        for (const providers of [undefined, []]) {
            const browser = context()
            await collectWeb(browser, OPTS, { transport: 'classic-first' }, providers)
            expect(browser.executeScript.mock.calls[0][0]).toBe(classic)
            const bidiBrowser = context()
            await collectWeb(bidiBrowser, OPTS, { transport: 'bidi' }, providers)
            expect(bidiBrowser.execute.mock.calls[0][0]).toBe(bidi)
        }
    })

    it('keeps collectScript unchanged without providers and without provider attributes', () => {
        const script = collectScript({ counter: 2, all: false, boxes: false, assignRefs: 'ephemeral' }, [])
        expect(script).toBe(collectScript({ counter: 2, all: false, boxes: false, assignRefs: 'ephemeral' }))
        expect(script).toContain(`(${collectInPage.toString()})(JSON.parse(`)
        const literal = /JSON\.parse\((".*")\)\)$/.exec(script)![1]
        expect(JSON.parse(JSON.parse(literal))).not.toHaveProperty('providerAttributes')
    })
})
