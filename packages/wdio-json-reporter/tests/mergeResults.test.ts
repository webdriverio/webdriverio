import path from 'node:path'
import { describe, expect, it } from 'vitest'

import mergeResults from '../src/mergeResults.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('mergeResults', () => {
    it('should merge json result correctly', async () => {
        const result = await mergeResults(path.join(__dirname, '__fixtures__'), 'wdio-.*.json')
        expect(result.capabilities).toHaveLength(2)
        expect(result.specs).toHaveLength(2)
        expect(result.suites).toHaveLength(2)
    })
})
