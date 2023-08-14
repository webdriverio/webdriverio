import path from 'node:path'
import url from 'node:url'

import unimport from 'unimport/unplugin'
import { expect, vi, test } from 'vitest'
import { isNuxtFramework, optimizeForNuxt } from '../../../src/vite/frameworks/nuxt.js'
import { hasFileByExtensions, hasDir } from '../../../src/vite/utils.js'

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

vi.mock('../../../src/vite/utils.js', () => ({
    hasFileByExtensions: vi.fn(),
    hasDir: vi.fn()
}))

vi.mock('/foo/bar/nuxt.config.js', () => ({}))

test('isNuxtFramework', async () => {
    expect(await isNuxtFramework('/foo/bar')).toBe(false)
    vi.mocked(hasDir).mockResolvedValueOnce(false)
    vi.mocked(hasFileByExtensions).mockResolvedValueOnce('true')
    expect(await isNuxtFramework('/foo/bar')).toBe(true)
})

test('optimizeForNuxt', async () => {
    const options: any = {}
    vi.mocked(hasDir).mockResolvedValueOnce(true)
    vi.mocked(hasFileByExtensions).mockResolvedValueOnce('true')
    const optimizations = await optimizeForNuxt(options, { rootDir } as any)
    expect(optimizations).toEqual( {
        plugins: [
            'the right plugin'
        ],
        resolve: {
            alias: {
                '~': '/foo/bar'
            },
        },
    })
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
})
