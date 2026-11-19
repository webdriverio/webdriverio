import fs from 'node:fs/promises'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { test, vi, expect } from 'vitest'

import { mockHoisting } from '../../../src/vite/plugins/mockHoisting.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const fixturePath = path.join(__dirname, '__fixtures__', 'test.js')
const TESTFILE = (await fs.readFile(fixturePath)).toString()

const mockHandler: any = {
    resolveId: vi.fn(),
    resetMocks: vi.fn(),
    manualMocks: [],
    unmock: vi.fn(),
    mocks: {
        get: vi.fn().mockReturnValue({
            namedExports: ['foo', 'bar', 'default'],
            path: 'mocked'
        }),
        values: vi.fn().mockReturnValue([{
            path: 'algoliasearch/lite',
            origin: '/some/path',
            namedExports: ['default']
        }, {
            path: '/path/to/project/constants',
            origin: '/path/to/project/src/components',
            namedExports: ['HEADING']
        }])
    }
}

test('exposes correct format', () => {
    const plugins = mockHoisting(mockHandler)
    expect(plugins.prime).toBeTypeOf('function')
    expect(Array.from(plugins)).toEqual([{
        name: 'wdio:mockHoisting:pre',
        enforce: 'pre',
        load: expect.any(Function),
        resolveId: expect.any(Function)
    }, {
        name: 'wdio:mockHoisting',
        enforce: 'post',
        transform: expect.any(Function),
        configureServer: expect.any(Function)
    }])
})

test('does not transform if files that user should not be able to mock', () => {
    const postPlugin = mockHoisting(mockHandler).pop()!
    expect((postPlugin.transform as Function)('foobar', '@vite/client')).toEqual({ code: 'foobar' })
})

test('transforms test file properly for mocking', () => {
    const postPlugin = mockHoisting(mockHandler).pop()!
    const testfilePath = os.platform() === 'win32' ? '/C:/sometest.ts' : 'sometest.ts'
    const originalUrl = `/foo?spec=/${testfilePath}`
    const server = {
        middlewares: { use: (_: never, cb: Function) => cb({ originalUrl }, {}, vi.fn()) }
    }
    ;(postPlugin.configureServer as Function)(server)()
    const newCode = (postPlugin.transform as Function)(TESTFILE, os.platform() === 'win32' ? testfilePath : `/${testfilePath}`)

    delete newCode.map.file
    delete newCode.map.sources

    expect(newCode).toMatchSnapshot()
    expect(mockHandler.resetMocks).toBeCalledTimes(2)
})

test('transforms any other imported file properly for mocking', () => {
    const postPlugin = mockHoisting(mockHandler).pop()!
    const testfilePath = os.platform() === 'win32' ? '/C:/sometest.ts' : 'sometest.ts'
    const serverA = {
        middlewares: { use: (_: never, cb: Function) => cb({ originalUrl: `/foo?spec=/${testfilePath}` }, {}, vi.fn()) }
    }
    ;(postPlugin.configureServer as Function)(serverA)()
    ;(postPlugin.transform as Function)(TESTFILE, os.platform() === 'win32' ? testfilePath : `/${testfilePath}`)
    const originalUrl = '/some/other/dependency.js'
    const serverB = {
        middlewares: { use: (_: never, cb: Function) => cb({ originalUrl }, {}, vi.fn()) }
    }
    ;(postPlugin.configureServer as Function)(serverB)()
    const newCode = (postPlugin.transform as Function)(TESTFILE, originalUrl)
    newCode.code = newCode.code.replace('C:/', '').replace('D:/', '') // fix for Windows

    delete newCode.map.file
    delete newCode.map.sources

    expect(newCode).toMatchSnapshot()
})

test('awaits side-effect imports after the spec mock factories', () => {
    const plugins = mockHoisting(mockHandler)
    const spec = '/side-effect.test.ts'
    plugins.prime(spec)
    const code = [
        "import { mock } from '@wdio/browser-runner'",
        "import './component.js'",
        "mock('./value.js', async () => ({ value: 'mocked' }))"
    ].join('\n')
    const transformed = (plugins[1].transform as Function)(code, spec).code as string
    const deferredImport = transformed.match(/await import\(['"]\.\/component\.js['"]\)/)

    expect(deferredImport).not.toBeNull()
    expect(transformed.indexOf('await mock(')).toBeLessThan(deferredImport!.index!)
    expect(transformed).not.toMatch(/import\s+['"]\.\/component\.js['"]/)
})

test.each([
    "import './component.js'\nconsole.log('real')\n",
    "import { mock } from '@wdio/browser-runner'\nimport './component.js'\n",
    "import { mock } from '@wdio/browser-runner'\nimport './component.js'\nmock('./value.js')\n",
    "import { unmock } from '@wdio/browser-runner'\nimport './component.js'\nunmock('./value.js')\n"
])('preserves side-effect imports byte-for-byte without factory mocks: %s', (code) => {
    const plugins = mockHoisting({ ...mockHandler, manualMocks: [] })
    const spec = '/side-effect-real.test.ts'
    plugins.prime(spec)

    expect((plugins[1].transform as Function)(code, spec)).toEqual({ code })
})

test('preserves static side-effect imports in dependencies of a mocking spec', () => {
    const plugins = mockHoisting(mockHandler)
    const spec = '/side-effect.test.ts'
    plugins.prime(spec)
    ;(plugins[1].transform as Function)([
        "import { mock } from '@wdio/browser-runner'",
        "mock('./value.js', () => ({ value: 'mocked' }))"
    ].join('\n'), spec)
    const transformed = (plugins[1].transform as Function)("import './register.js'", '/component.js').code

    expect(transformed).toContain("import './register.js'")
    expect(transformed).not.toContain('await import(')
})

test('keeps side-effect imports in order with binding imports', () => {
    const plugins = mockHoisting(mockHandler)
    const spec = '/side-effect-order.test.ts'
    plugins.prime(spec)
    const transformed = (plugins[1].transform as Function)([
        "import { mock } from '@wdio/browser-runner'",
        "import './a.js'",
        "import { value } from './named.js'",
        "import './b.js'",
        "import './a.js'",
        "mock('./value.js', async () => ({ value: 'mocked' }))"
    ].join('\n'), spec).code as string
    const imports = [...transformed.matchAll(/await import\(['"]([^'"]+)['"]\)/g)]

    expect(imports.map((match) => match[1])).toEqual(['./a.js', './named.js', './b.js', './a.js'])
    expect(transformed.indexOf('await mock(')).toBeLessThan(imports[0].index!)
})

test('provides a declared actual namespace for a mocked side-effect import factory', () => {
    const plugins = mockHoisting(mockHandler)
    const spec = '/side-effect-actual.test.ts'
    plugins.prime(spec)
    const transformed = (plugins[1].transform as Function)([
        "import { mock } from '@wdio/browser-runner'",
        "import './value.js'",
        "mock('./value.js', async (actual) => ({ value: actual.value }))"
    ].join('\n'), spec).code as string
    const actualImport = transformed.match(/import \* as (__wdio_import\d+) from ['"]\.\/value\.js['"]/)

    expect(actualImport).not.toBeNull()
    expect(transformed).toContain(`}), ${actualImport![1]})`)
    expect(transformed).toMatch(/await import\(['"]\.\/value\.js['"]\)/)
})

test('does not invent an actual namespace for a zero-argument side-effect mock factory', () => {
    const plugins = mockHoisting(mockHandler)
    const spec = '/side-effect-zero.test.ts'
    plugins.prime(spec)
    const transformed = (plugins[1].transform as Function)([
        "import { mock } from '@wdio/browser-runner'",
        "import './value.js'",
        "mock('./value.js', () => ({ value: 'mocked' }))"
    ].join('\n'), spec).code as string

    expect(transformed).not.toContain('__wdio_import')
    expect(transformed).toMatch(/await import\(['"]\.\/value\.js['"]\)/)
})
