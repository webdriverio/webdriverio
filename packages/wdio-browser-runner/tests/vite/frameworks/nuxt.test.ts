import path from 'node:path'
import url from 'node:url'

import unimport from 'unimport/unplugin'
import { expect, vi, test } from 'vitest'
import { isNuxtFramework, optimizeForNuxt } from '../../../src/vite/frameworks/nuxt.js'
import { hasFile } from '../../../src/vite/frameworks/utils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '__fixtures__')

vi.mock('unimport/unplugin', () => ({
    default: { vite: vi.fn().mockReturnValue('the right plugin') }
}))

vi.mock('unimport', () => ({
    scanDirExports: vi.fn().mockResolvedValue(['some', 'imports'])
}))

vi.mock('nuxt', () => ({
    loadNuxt: vi.fn().mockResolvedValue({
        options: {
            _layers: [{
                config: {
                    srcDir: '/foo/bar',
                    imports: {
                        dirs: ['foobar']
                    }
                }
            }]
        }
    })
}))

vi.mock('../../../src/vite/frameworks/utils.js', () => ({
    hasFile: vi.fn()
}))

vi.mock('/foo/bar/nuxt.config.js', () => ({}))

test('isNuxtFramework', async () => {
    expect(await isNuxtFramework('/foo/bar')).toBe(false)
    vi.mocked(hasFile).mockResolvedValueOnce(false)
    vi.mocked(hasFile).mockResolvedValueOnce(true)
    expect(await isNuxtFramework('/foo/bar')).toBe(true)
})

test('optimizeForNuxt', async () => {
    const viteConfig = { plugins: [] }
    vi.mocked(hasFile).mockResolvedValueOnce(true)
    await optimizeForNuxt(viteConfig, {} as any, { rootDir } as any)
    expect(viteConfig.plugins).toEqual(['the right plugin'])
    expect(unimport.vite).toBeCalledWith({
        imports: ['some', 'imports'],
        presets: ['vue']
    })
})
