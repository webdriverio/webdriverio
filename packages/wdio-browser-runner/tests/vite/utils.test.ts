import type fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { describe, it, vi, expect, beforeAll, afterAll } from 'vitest'
import { resolve } from 'import-meta-resolve'

import { getTemplate, userfriendlyImport, getErrorTemplate, getFilesFromDirectory, getAliasMap } from '../../src/vite/utils.js'

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

const join = vi.spyOn(path, 'join')
beforeAll(() => {
    join.mockImplementation((...args) => `/foo/bar/${args[args.length - 1]}`)
})
afterAll(() => {
    join.mockRestore()
})

describe('getTemplate', () => {
    it('renders template correctly', async () => {
        // on Windows this resolves to e.g. `D:\foo\bar`, normalized below to keep one snapshot
        const sourceMapDir = path.resolve('/foo/bar')
        vi.mocked(resolve).mockResolvedValue(url.pathToFileURL(path.resolve(sourceMapDir, 'vue')).href)
        /**
         * ensure we have CI env set so local and CI test pass
         */
        if (!process.env.CI) {
            process.env.CI = '1'
        }
        const p: any = { env: { some: 'env' }, cwd: () => '/some/cwd' }
        const template = await getTemplate({ preset: 'lit' }, { config: {} } as any, '/spec.js', p)
        expect(template.replace(sourceMapDir, '/foo/bar')).toMatchSnapshot()
    })

    it('escapes the spec path for the inline script and the HTML attribute', async () => {
        const spec = '/home/O\'Brien/a"b&c</script><!--.test.js'
        const p: any = { env: {}, cwd: () => '/some/cwd' }
        const template = await getTemplate({}, { config: {} } as any, spec, p)

        const line = template.split('\n').find((l) => l.includes('window.__wdioSpec__'))!.trim()
        const window: { __wdioSpec__?: string } = {}
        new Function('window', line)(window)
        expect(window.__wdioSpec__).toBe(spec)
        expect(template).not.toContain('</script><!--.test.js')

        const attribute = template.match(/<mocha-framework spec="([^"]*)"/)![1]
        expect(attribute).toBe('/home/O\'Brien/a&quot;b&amp;c&lt;/script&gt;&lt;!--.test.js')
    })

    it('escapes env, process env, cwd and aliases for the inline scripts', async () => {
        const evil = '</script><!--'
        const p: any = { env: { HTML: evil }, cwd: () => `/cwd/${evil}` }
        const template = await getTemplate({}, { config: { value: evil } } as any, '/spec.js', p, { [evil]: evil })
        expect(template).not.toContain(evil)
        expect(template).toContain('\\u003c/script>\\u003c!--')
    })

    it('uses the given aliases for mock resolution', async () => {
        const p: any = { env: {}, cwd: () => '/cwd' }
        const template = await getTemplate({}, { config: {} } as any, '/spec.js', p, { '@app': '/src' })
        expect(template).toContain('const alias = {"@app":"/src"}')
    })
})

describe('getAliasMap', () => {
    it('converts object and resolved list aliases into a prefix map', () => {
        expect(getAliasMap()).toEqual({})
        expect(getAliasMap({ '@app': '/src' })).toEqual({ '@app': '/src' })
        expect(getAliasMap([
            { find: '@app', replacement: '/src' },
            { find: /^\/?@vite\/env/, replacement: '/@fs/env.mjs' }
        ])).toEqual({ '@app': '/src' })
        if (process.platform === 'win32') {
            expect(getAliasMap({ '@app': 'C:\\proj\\src' })).toEqual({ '@app': '/C:/proj/src' })
        }
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

describe('getFilesFromDirectory', () => {
    it('does not fail if directory does not exist', async () => {
        expect(await getFilesFromDirectory('./foo/bar')).toEqual([])
    })

    it('returns all files and subfiles', async () => {
        join.mockRestore()
        const files = await getFilesFromDirectory(path.join(__dirname, '..', '__fixtures__', '__mocks__'))
        expect(files.map((f) => path.basename(f))).toEqual(['otherModule.js', 'someModule.ts'])
    })
})
