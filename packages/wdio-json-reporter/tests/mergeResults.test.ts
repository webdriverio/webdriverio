import url from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import mergeResults from '../src/mergeResults.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('mergeResults', () => {
    it('should merge json result correctly', async () => {
        const result = await mergeResults(path.resolve(__dirname, '__fixtures__'), 'wdio-.*.json')
        expect(result.capabilities).toHaveLength(2)
        expect(result.specs).toHaveLength(2)
        expect(result.suites).toHaveLength(2)
    })
})
