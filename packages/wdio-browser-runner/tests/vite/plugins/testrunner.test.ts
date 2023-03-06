import os from 'node:os'
import path from 'node:path'
import { test, vi, expect } from 'vitest'
import { resolve } from 'import-meta-resolve'

import { testrunner } from '../../../src/vite/plugins/testrunner.js'
import { getTemplate, getErrorTemplate } from '../../../src/vite/utils.js'
import { SESSIONS } from '../../../src/constants.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))
vi.mock('../../../src/vite/utils.js', () => ({
    getTemplate: vi.fn(),
    getErrorTemplate: vi.fn(),
    normalizeId: vi.fn((id) => id)
}))

test('exposes correct format', () => {
    expect(testrunner({})).toEqual([{
        name: 'wdio:testrunner',
        enforce: 'pre',
        resolveId: expect.any(Function),
        load: expect.any(Function),
        transform: expect.any(Function),
        configureServer: expect.any(Function)
    }, {
        name: 'modern-node-polyfills',
        resolveId: expect.any(Function)
    }])
})

test('resolveId', async () => {
    // skip for Windows
    if (os.platform() === 'win32') {
        return
    }

    const plugin = testrunner({})
    expect(await (plugin[0].resolveId as Function)('virtual:wdio'))
        .toBe('\0virtual:wdio')

    expect(await (plugin[0].resolveId as Function)('@wdio/browser-runner/setup'))
        .toContain(path.join('browser', 'setup.js'))

    expect(await (plugin[0].resolveId as Function)('@wdio/browser-runner'))
        .toContain(path.join('browser', 'spy.js'))

    vi.mocked(resolve).mockResolvedValue('file:///foo/bar')
    expect(await (plugin[0].resolveId as Function)('@wdio/config'))
        .toBe('/foo/bar')

    expect(await (plugin[0].resolveId as Function)('node:module'))
        .toContain(path.join('nodelibs', 'browser', 'module.js'))
})

test('load', () => {
    const plugin = testrunner({})
    const js = (plugin[0].load as Function)('\0virtual:wdio')
    expect(js).toContain('export const commands = ["newSession","deleteSession","getSession"')
    expect(js).toContain('export const automationProtocolPath =')
    expect((plugin[0].load as Function)('something else')).toBe(undefined)
})

test('transform', () => {
    const plugin = testrunner({})
    expect((plugin[0].transform as Function)('foobar', 'barfoo')).toEqual({ code: 'foobar' })

    const expectJS = `
        var fs = _interopRequireWildcard(require_graceful_fs());
        var expect_default = require_build11();
        process.stdout.isTTY
    `
    expect((plugin[0].transform as Function)(expectJS, '.vite/deps/expect.js')).toMatchSnapshot()
})

const req = { headers: { cookie: '' } }
test('configureServer continues if no url given', async () => {
    const plugin = testrunner({})
    const server = { middlewares: { use: vi.fn() }, transformIndexHtml: vi.fn((...args) => args) }
    ;(plugin[0].configureServer as Function)(server)()
    expect(server.middlewares.use).toBeCalledWith(expect.any(Function))

    const middleware = vi.mocked(server.middlewares.use).mock.calls[0][0]
    const next = vi.fn()
    const res = { end: vi.fn() }
    middleware({}, {}, next)
    expect(next).toBeCalledWith()
    next.mockClear()

    middleware({ ...req, originalUrl: 'https://google.com' }, {}, next)
    expect(next).toBeCalledWith()
    next.mockClear()

    middleware({ ...req, originalUrl: 'http://localhost:1234/?cid=1-2&spec=foobar' }, {}, next)
    expect(next).toBeCalledWith()
    next.mockClear()

    SESSIONS.set('1-2', {} as any)
    middleware({ ...req, originalUrl: 'http://localhost:1234/?cid=1-2' }, {}, next)
    expect(next).toBeCalledWith()
    next.mockClear()

    vi.mocked(getTemplate).mockResolvedValue('some html')
    await middleware({ ...req, originalUrl: 'http://localhost:1234/?cid=1-2&spec=foobar' }, res, next)
    expect(getTemplate).toBeCalledTimes(1)
    expect(next).toBeCalledWith()
    expect(res.end).toBeCalledWith([
        'http://localhost:1234/?cid=1-2&spec=foobar',
        'some html'
    ])
    next.mockClear()
    vi.mocked(getTemplate).mockClear()

    vi.mocked(getTemplate).mockRejectedValue(new Error('ups'))
    vi.mocked(getErrorTemplate).mockReturnValue('some error html')
    await middleware({ ...req, originalUrl: 'http://localhost:1234/?cid=1-2&spec=foobar' }, res, next)
    expect(getTemplate).toBeCalledTimes(1)
    expect(getErrorTemplate).toBeCalledTimes(1)
    expect(next).toBeCalledWith()
    expect(res.end).toBeCalledWith([
        'http://localhost:1234/?cid=1-2&spec=foobar',
        'some error html'
    ])
})
