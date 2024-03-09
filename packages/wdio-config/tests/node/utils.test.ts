import { describe, beforeEach, it, expect, vi } from 'vitest'
import { resolve } from 'import-meta-resolve'
import type fspType from 'node:fs/promises'
import type { PathLike } from 'node:fs'

import { loadTypeScriptCompiler } from '../../src/node/utils.js'

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue('file:///some/path')
}))

vi.mock('node:fs/promises', async () => {
    const actualFsp = await vi.importActual<typeof fspType>('node:fs/promises')
    return {
        ...actualFsp,
        access: async (path: PathLike) => {
            if (path instanceof URL) {
                if (path.href === 'file:///some/path') {
                    return undefined
                }
                if (path.href === 'file:///some/missing/path') {
                    throw new Error('ups')
                }
            }
            return actualFsp.access(path)
        },
    }
})

describe('loadTypeScriptCompiler', () => {
    beforeEach(() => {
        vi.mocked(resolve).mockClear()
        vi.unstubAllEnvs()
    })

    it('should return true if tsconfig exists', async () => {
        expect(await loadTypeScriptCompiler({})).toBe(true)
        expect(resolve).toBeCalledTimes(2)
    })

    it('should return false if tsconfig exists', async () => {
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler({})).toBe(false)
        expect(resolve).toBeCalledTimes(1)
    })

    it('should return false if WDIO_WORKER_ID is set', async () => {
        vi.stubEnv('WDIO_WORKER_ID', '1')
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler({})).toBe(false)
        expect(resolve).toBeCalledTimes(0)
    })

    it('should return false if if ts-node/esm/transpile-only.mjs does not exist', async () => {
        const mock = vi.mocked(resolve)
        // resolve the first resolve call to an existing path and the second resolve call to a missing path
        mock.mockResolvedValue('file:///some/missing/path').mockResolvedValueOnce('file:///some/path')
        expect(await loadTypeScriptCompiler({})).toBe(false)
        expect(resolve).toBeCalledTimes(2)
        expect(mock).toBeCalledTimes(2)
        expect(mock.mock.calls[0][0]).toBe('ts-node')
        expect(mock.mock.results[0]).toStrictEqual({ type: 'return', value: 'file:///some/path' })
        expect(mock.mock.calls[1][0]).toBe('ts-node/esm/transpile-only.mjs')
        expect(mock.mock.results[1]).toStrictEqual({ type: 'return', value: 'file:///some/missing/path' })
    })
})
