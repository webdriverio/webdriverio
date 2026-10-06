import { describe, expect, it, vi } from 'vitest'

import { roleTable } from '@wdio/utils'
import { collectWeb } from '../src/collect.js'

const RESULT = { tree: { role: 'document', children: [] }, counter: 3 }

function context () {
    return {
        execute: vi.fn().mockResolvedValue(RESULT),
        executeScript: vi.fn().mockResolvedValue(RESULT)
    } as unknown as WebdriverIO.Browser & { execute: ReturnType<typeof vi.fn>, executeScript: ReturnType<typeof vi.fn> }
}

describe('collectWeb', () => {
    it('sends the options as one JSON string over BiDi', async () => {
        const browser = context()
        const result = await collectWeb(browser, { counter: 7 }, { transport: 'bidi' })
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
        await collectWeb(browser, {}, { transport: 'classic-first', scope })
        const [, json, element] = browser.execute.mock.calls[0]
        expect(typeof json).toBe('string')
        expect(JSON.parse(json).assignRefs).toBe(true)
        expect(element).toBe(scope)
        expect(browser.executeScript).not.toHaveBeenCalled()
    })

    it('uses the classic endpoint first', async () => {
        const browser = context()
        await collectWeb(browser, {}, { transport: 'classic-first' })
        expect(browser.executeScript).toHaveBeenCalledTimes(1)
        expect(browser.execute).not.toHaveBeenCalled()
    })

    it('falls back to a JSON string over BiDi when the classic endpoint fails', async () => {
        const browser = context()
        browser.executeScript.mockRejectedValue(new Error('unsupported'))
        const result = await collectWeb(browser, {}, { transport: 'classic-first' })
        expect(result.classicUnavailable).toBe(true)
        expect(typeof browser.execute.mock.calls[0][1]).toBe('string')
    })
})
