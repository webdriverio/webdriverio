import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

describe('worker grouped spec files', () => {
    it('retains the same complete list in the second spec', () => {
        assert.deepEqual(globalThis.specFilesFromRequire, [
            fileURLToPath(new URL('./first spec.js', import.meta.url)),
            fileURLToPath(import.meta.url)
        ])
    })
})
