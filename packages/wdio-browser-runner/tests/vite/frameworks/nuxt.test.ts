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
    scanDirExports: vi.fn().mockResolvedValue([{
        from: '/foo/bar',
        name: 'foobar',
        as: 'foobar'
    }, {
        from: '/node_modules/nuxt/dist/app/composables/foo',
        name: 'barfoo',
        as: 'barfoo'
    }]),
    scanExports: vi.fn().mockResolvedValue([{
        from: '/foo/bar/loo',
        name: 'foobarloo',
        as: 'foobarloo'
    }])
}))

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue(url.pathToFileURL('/foo/bar'))
}))

vi.mock('@nuxt/kit', () => ({
    loadNuxtConfig: vi.fn().mockResolvedValue({
        _layers: [{
            config: {
                srcDir: '/foo/bar',
                imports: {
                    dirs: ['foobar']
                }
            }
        }],
        alias: {
            '~': '/foo/bar'
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
    const options: any = {}
    vi.mocked(hasFile).mockResolvedValueOnce(true)
    await optimizeForNuxt(options, { rootDir } as any)
    expect(options.viteConfig.plugins).toEqual(['the right plugin'])
    expect(unimport.vite).toBeCalledWith({
        imports: [{
            from: '/foo/bar',
            name: 'foobar',
            as: 'foobar'
        }, {
            from: 'virtual:wdio',
            name: 'wrappedFn',
            as: 'barfoo'
        }, {
            from: '/foo/bar/loo',
            name: 'foobarloo',
            as: 'foobarloo'
        }],
        presets: ['vue']
    })
    expect(options.viteConfig.resolve.alias).toEqual({ '~': '/foo/bar' })
})
