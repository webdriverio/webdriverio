import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

import { describe, it, vi, expect } from 'vitest'
import { resolve } from 'import-meta-resolve'

import { getTemplate, userfriendlyImport, getErrorTemplate, getFilesFromDirectory } from '../../src/vite/utils.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

vi.mock('node:fs/promises', async (orig) => {
    const { readdir, stat, access } = await orig() as typeof fs
    return {
        default: {
            readFile: vi.fn().mockResolvedValue('some code'),
            readdir, stat, access
        }
    }
})
vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))
vi.mock('fakeDep', () => ({
    default: 'I am fake'
}))

// skip for Windows
if (os.platform() !== 'win32') {
    describe('getTemplate', () => {
        it('fails if vue helpers are not installed', async () => {
            vi.mocked(resolve).mockRejectedValue(new Error('not there'))
            await expect(getTemplate({ preset: 'vue' }, {} as any, ''))
                .rejects.toThrow(/Fail to set-up Vue environment/)
        })

        it('renders template correctly', async () => {
            vi.mocked(resolve).mockResolvedValue('file:///foo/bar/vue')
            /**
             * ensure we have CI env set so local and CI test pass
             */
            if (!process.env.CI) {
                process.env.CI = '1'
            }
            expect(await getTemplate({ preset: 'vue' }, {} as any, '/spec.js', { some: 'env' })).toMatchSnapshot()
            expect(fs.readFile).toBeCalledTimes(2)
        })
    })
}

describe('userfriendlyImport', () => {
    it('returns nothing if pkg is empty', async () => {
        expect(await userfriendlyImport('lit')).toEqual({})
    })

    it('returns correct package', async () => {
        expect((await userfriendlyImport('lit', 'fakeDep')).default).toEqual('I am fake')
    })

    it('throws if pkg is not installed', async () => {
        await expect(userfriendlyImport('lit', 'foobar')).rejects.toThrow(/Couldn't load preset/)
    })
})

describe('getErrorTemplate', () => {
    it('returns correct template', () => {
        expect(getErrorTemplate('/foobar', new Error('ups'))).toContain('<pre>Error: ups')
    })
})

describe('getFilesFromDirectory', () => {
    it('does not fail if directory does not exist', async () => {
        expect(await getFilesFromDirectory('./foo/bar')).toEqual([])
    })

    it('returns all files and subfiles', async () => {
        const files = await getFilesFromDirectory(path.join(__dirname, '..', '__fixtures__', '__mocks__'))
        expect(files.map((f) => path.basename(f))).toEqual(['otherModule.js', 'someModule.ts'])
    })
})
