import url from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

import mergeResults from '../src/mergeResults.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('mergeResults', () => {
    it('should merge json result correctly', async () => {
        const result = await mergeResults(path.resolve(__dirname, '__fixtures__'), 'wdio-.*.json')
        expect(result.capabilities).toHaveLength(2)
        expect(result.specs).toHaveLength(2)
        expect(result.suites).toHaveLength(2)
    })

    it('should be importable via both export paths', () => {
        // Test that both export paths work and import the same function
        const currentDir = path.dirname(url.fileURLToPath(import.meta.url))
        const packageRoot = path.resolve(currentDir, '..')
        const require2 = createRequire(path.join(packageRoot, 'package.json'))

        // Test the original export path (for backward compatibility)
        const mergeResultsOriginal = require2('@wdio/json-reporter/mergeResults')
        expect(typeof mergeResultsOriginal.default).toBe('function')

        // Test the new build/ export path (fixes the reported issue)
        const mergeResultsBuild = require2('@wdio/json-reporter/build/mergeResults')
        expect(typeof mergeResultsBuild.default).toBe('function')

        // Verify they're the same function reference
        expect(mergeResultsOriginal.default).toBe(mergeResultsBuild.default)
    })
})
