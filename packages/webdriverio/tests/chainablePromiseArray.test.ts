import { describe, it, expect } from 'vitest'
import type { ChainablePromiseArray } from '../src/types.js'

describe('ChainablePromiseArray', () => {
    it('entries should return an async iterator of key/value pairs', async () => {
        const elements = [
            { elementId: 'elem1' },
            { elementId: 'elem2' },
            { elementId: 'elem3' }
        ]
        const chainablePromiseArray: ChainablePromiseArray = {
            entries: async function* () {
                for (const [index, element] of elements.entries()) {
                    yield [index, element]
                }
            }
        } as any

        const entries = []
        for await (const entry of chainablePromiseArray.entries()) {
            entries.push(entry)
        }

        expect(entries).toEqual([
            [0, { elementId: 'elem1' }],
            [1, { elementId: 'elem2' }],
            [2, { elementId: 'elem3' }]
        ])
    })
})
