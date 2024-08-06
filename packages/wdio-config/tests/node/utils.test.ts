import { describe, beforeEach, it, expect, vi } from 'vitest'
import { resolve } from 'import-meta-resolve'
import type fspType from 'node:fs/promises'
import type { PathLike } from 'node:fs'

import { loadTypeScriptCompiler } from '../../src/node/utils.js'

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue('file:///some/path')
}))

vi.mock('node:fs/promises', async () => {
    const actualFsp = await vi.importActual<typeof fspType>('node:fs')
    return {
        ...actualFsp,
        access: (path: PathLike) => {
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
        expect(await loadTypeScriptCompiler()).toBe(true)
        expect(resolve).toBeCalledTimes(1)
    })

    it('should return false if tsconfig exists', async () => {
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler()).toBe(false)
        expect(resolve).toBeCalledTimes(1)
    })

    it('should return false if WDIO_WORKER_ID is set', async () => {
        vi.stubEnv('WDIO_WORKER_ID', '1')
        vi.mocked(resolve).mockRejectedValue(new Error('ups'))
        expect(await loadTypeScriptCompiler()).toBe(false)
        expect(resolve).toBeCalledTimes(0)
    })

    it('should return false if tsx does not exist', async () => {
        const mock = vi.mocked(resolve)
        mock.mockReturnValue('file:///some/missing/path')
        expect(await loadTypeScriptCompiler()).toBe(false)
        expect(resolve).toBeCalledTimes(1)
        expect(mock).toBeCalledTimes(1)
        expect(mock.mock.calls[0][0]).toBe('tsx')
        expect(mock.mock.results[0]).toStrictEqual({ type: 'return', value: 'file:///some/missing/path' })
    })
})
