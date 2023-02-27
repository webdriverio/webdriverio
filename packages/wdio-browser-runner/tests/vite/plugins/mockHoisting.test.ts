import fs from 'node:fs/promises'
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
    mocks: { get: vi.fn().mockReturnValue({
        namedExports: ['foo', 'bar', 'default'],
        path: 'mocked'
    }) }
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
    const server = {
        middlewares: { use: (_: never, cb: Function) => cb({ url: '/foo?spec=/sometest.ts' }, {}, vi.fn()) }
    }
    ;(postPlugin.configureServer as Function)(server)()
    expect((postPlugin.transform as Function)(TESTFILE, '/sometest.ts')).toMatchSnapshot()
    expect(mockHandler.resetMocks).toBeCalledTimes(1)
})

test('returns original file', async () => {
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)(`/@mock${fixturePath}`)).toBe(TESTFILE)
})

test('returns mock file', async () => {
    const prePlugin = mockHoisting(mockHandler).shift()!
    expect(await (prePlugin.load as Function)('foobar')).toMatchSnapshot()
})
