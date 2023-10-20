import { describe, beforeEach, it, expect, vi } from 'vitest'
import { resolve } from 'import-meta-resolve'

import { loadTypeScriptCompiler } from '../../src/node/utils.js'

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue('/some/path')
}))

describe('loadTypeScriptCompiler', () => {
    beforeEach(() => {
        vi.mocked(resolve).mockClear()
    })

    it('should return true if tsconfig exists', async () => {
        expect(await loadTypeScriptCompiler({})).toBe(true)
        expect(resolve).toBeCalledTimes(1)
    })

    it('should return false if tsconfig exists', async () => {
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler({})).toBe(false)
        expect(resolve).toBeCalledTimes(1)
    })

    it('should return false if WDIO_WORKER_ID is set', async () => {
        process.env.WDIO_WORKER_ID = '1'
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler({})).toBe(false)
        expect(resolve).toBeCalledTimes(0)
    })
})
