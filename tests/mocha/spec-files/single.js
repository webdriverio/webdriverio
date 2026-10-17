import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

globalThis.specFilesModuleLoaded = true

describe('independent worker spec files', () => {
    it('exposes only its own single file during require setup', () => {
        assert.deepEqual(globalThis.specFilesFromRequire, [fileURLToPath(import.meta.url)])
    })
})
