import fs from 'node:fs/promises'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { test, vi, expect } from 'vitest'

import { mockHoisting, isSameModulePath } from '../../../src/vite/plugins/mockHoisting.js'
import { MODULE_EXTENSION } from '../../../src/constants.js'

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

test('isSameModulePath matches an import and a mock when only one has a file extension', () => {
    const base = path.resolve('/proj/src/foo')
    expect(isSameModulePath(base, `${base}.ts`)).toBe(true)
    expect(isSameModulePath(`${base}.ts`, base)).toBe(true)
    expect(isSameModulePath(`${base}.ts`, `${base}.ts`)).toBe(true)
    expect(isSameModulePath(base, base)).toBe(true)
    expect(isSameModulePath(base, path.resolve('/proj/src/bar.ts'))).toBe(false)
    expect(isSameModulePath(base, path.resolve('/proj/src/foobar'))).toBe(false)
    expect(isSameModulePath(`${base}.service`, `${base}.service.ts`)).toBe(true)
    expect(isSameModulePath(`${base}.service`, base)).toBe(false)
    expect(isSameModulePath(base, `${base}.service`)).toBe(false)
    expect(isSameModulePath(base, `${base}.json`)).toBe(true)
})

test('rewrites a dependency import to the key the mock is stored under', () => {
    const postPlugin = mockHoisting(mockHandler).pop()!
    const isWin = os.platform() === 'win32'
    const specPath = isWin ? '/C:/proj/some.test.ts' : '/proj/some.test.ts'
    const server = {
        middlewares: { use: (_: never, cb: Function) => cb({ originalUrl: `/foo?spec=${specPath}` }, {}, vi.fn()) }
    }
    ;(postPlugin.configureServer as Function)(server)()
    ;(postPlugin.transform as Function)([
        'import { mock, fn } from \'@wdio/browser-runner\'',
        'mock(\'./foo.service.ts\', () => ({ foo: fn() }))'
    ].join('\n'), isWin ? specPath.slice(1) : specPath)

    const depPath = isWin ? 'C:/proj/dep.ts' : '/proj/dep.ts'
    const newCode = (postPlugin.transform as Function)('import { foo } from \'./foo.service\'\nfoo()', depPath)
    // `mock()` in the browser stores it under the spec dir + mock path without its module extension
    const mockKey = url.pathToFileURL(path.resolve(path.dirname(depPath), 'foo.service.ts')).pathname.replace(MODULE_EXTENSION, '')
    expect(newCode.code).toContain(`wdioImport("${mockKey}", __wdio_import0)`)
})

for (const [importPath, mockPath] of [['./foo', './foo.ts'], ['./foo.ts', './foo']]) {
    test(`mocks import '${importPath}' with mock('${mockPath}')`, () => {
        const postPlugin = mockHoisting(mockHandler).pop()!
        const specPath = os.platform() === 'win32' ? '/C:/proj/some.test.ts' : '/proj/some.test.ts'
        const server = {
            middlewares: { use: (_: never, cb: Function) => cb({ originalUrl: `/foo?spec=${specPath}` }, {}, vi.fn()) }
        }
        ;(postPlugin.configureServer as Function)(server)()
        const code = [
            'import { mock, fn } from \'@wdio/browser-runner\'',
            `import { foo } from '${importPath}'`,
            `mock('${mockPath}', () => ({ foo: fn() }))`,
            'foo()'
        ].join('\n')
        const newCode = (postPlugin.transform as Function)(code, os.platform() === 'win32' ? specPath.slice(1) : specPath)
        expect(newCode.code).toContain(`from "${importPath}";`)
        expect(newCode.code).not.toContain(`await import("${importPath}")`)
    })
}
