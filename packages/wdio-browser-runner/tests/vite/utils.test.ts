import os from 'node:os'
import fs from 'node:fs/promises'

import { describe, it, vi, expect } from 'vitest'
import { resolve } from 'import-meta-resolve'

import { getTemplate, userfriendlyImport, getErrorTemplate } from '../../src/vite/utils.js'

vi.mock('node:fs/promises', () => ({
    default: { readFile: vi.fn().mockResolvedValue('some code') }
}))
vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))
vi.mock('fakeDep', () => ({
    default: 'I am fake'
}))

describe('getTemplate', () => {
    it('fails if vue helpers are not installed', async () => {
        // skip for Windows
        if (os.platform() === 'win32') {
            return
        }
        vi.mocked(resolve).mockRejectedValue(new Error('not there'))
        await expect(getTemplate({ preset: 'vue' }, {} as any, ''))
            .rejects.toThrow(/Fail to set-up Vue environment/)
    })

    it('renders template correctly', async () => {
        // skip for Windows
        if (os.platform() === 'win32') {
            return
        }
        vi.mocked(resolve).mockResolvedValue('file:///foo/bar/vue')
        expect(await getTemplate({ preset: 'vue' }, {} as any, '/spec.js', { some: 'env' })).toMatchSnapshot()
        expect(fs.readFile).toBeCalledTimes(2)
    })
})

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
