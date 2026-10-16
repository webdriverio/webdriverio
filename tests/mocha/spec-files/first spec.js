import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

globalThis.specFilesModuleLoaded = true

describe('worker spec files from require', () => {
    it('exposes the full grouped list before the first spec is loaded', () => {
        assert.deepEqual(globalThis.specFilesFromRequire, [
            fileURLToPath(import.meta.url),
            fileURLToPath(new URL('./second-ü.js', import.meta.url))
        ])
    })
})
