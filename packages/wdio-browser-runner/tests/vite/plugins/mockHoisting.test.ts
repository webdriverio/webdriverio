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
    expect(mockHoisting(mockHandler)).toEqual([{
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

test('does not transform if file is not within spec', () => {
    const postPlugin = mockHoisting(mockHandler).pop()!
    expect((postPlugin.transform as Function)('foobar', 'barforr')).toEqual({ code: 'foobar' })
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
    expect(mockHandler.resetMocks).toBeCalledTimes(1)
})

test('returns original file', async () => {
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)(
        `/@mock${os.platform() === 'win32' ? '/' : ''}${fixturePath}`
    )).toBe(TESTFILE)
})

test('returns mock file', async () => {
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)('foobar')).toMatchSnapshot()
})

test('returns mock for prebundled dep', async () => {
    vi.mocked(mockHandler.mocks.get).mockReturnValue()
    const id = '/path/to/project/node_modules/.vite/deps/algoliasearch_lite.js?v=e31c24e7'
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)(id)).toMatchSnapshot()
})

test('returns mock for relative file import', async () => {
    vi.mocked(mockHandler.mocks.get).mockReturnValue()
    const id = '/path/to/project/constants.ts'
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)(id)).toMatchSnapshot()
})
