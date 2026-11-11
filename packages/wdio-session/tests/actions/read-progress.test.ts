/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { RefRegistry } from '@wdio/snapshot'

import { read } from '../../src/actions/observe.js'
import { cmdWith } from '../../src/hints.js'
import type { Session } from '../../src/session.js'

/** `read` with its in-page callback run on the jsdom document */
function pageSession () {
    return {
        isWeb: true,
        applies: ['W'],
        cmd: cmdWith(),
        get: () => undefined,
        refs: new RefRegistry(),
        browser: { execute: async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args) }
    } as unknown as Session
}

describe('read --offset with a tiny --max-chars', () => {
    it('moves forward on every part and ends after the last one', async () => {
        document.body.innerHTML = '<main><p>A</p><p>B</p></main>'
        const offsets: number[] = []
        const parts: string[] = []
        let offset = 0
        for (let step = 0; step < 10; step++) {
            const result = await read(pageSession(), { maxChars: 1, offset })
            parts.push(result.text)
            const next = /--offset (\d+)/.exec(result.text)?.[1]
            if (!next) {
                break
            }
            expect(Number(next)).toBeGreaterThan(offset)
            expect(offsets).not.toContain(Number(next))
            offsets.push(Number(next))
            offset = Number(next)
        }
        expect(offsets.length).toBeLessThan(10)
        expect(parts.some((part) => part.startsWith('B'))).toBe(true)
        expect(parts.at(-1)).not.toContain('--offset')
    })
})
