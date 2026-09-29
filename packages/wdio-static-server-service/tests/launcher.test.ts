import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import morgan from 'morgan'
import { test, expect, vi, afterEach } from 'vitest'

import StaticServerLauncher from '../src/launcher.js'
import * as StaticServerEntry from '../src/index.js'

vi.mock('fs')
vi.mock('express')
vi.mock('morgan', () => ({ default: vi.fn() }))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const server = vi.mocked(express)() as unknown as {
    use: ReturnType<typeof vi.fn>
    listen: ReturnType<typeof vi.fn>
}
vi.mocked(express).mockClear()

afterEach(() => {
    server.use.mockClear()
    server.listen.mockClear()
    vi.mocked(express).mockClear()
    vi.mocked(express.static).mockReset()
    vi.mocked(fs.createWriteStream).mockReset()
    vi.mocked(morgan).mockReset()
})

test('should not start server when no mount folder is defined', async () => {
    const service = new StaticServerLauncher({})
    await service.onPrepare({})
    expect(express).not.toHaveBeenCalled()
    expect(server.listen).not.toHaveBeenCalled()
})

test('should be able to start server', async () => {
    const staticMiddleware = vi.fn()
    vi.mocked(express.static).mockReturnValueOnce(staticMiddleware as never)

    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' }
    })
    await service.onPrepare({})

    expect(express).toHaveBeenCalledTimes(1)
    expect(express.static).toHaveBeenCalledWith('bar')
    expect(server.use).toHaveBeenCalledWith('foo', staticMiddleware)
    expect(server.listen).toHaveBeenCalledWith(4567, expect.any(Function))
})

test('should be able to mount multiple folder', async () => {
    const first = vi.fn()
    const second = vi.fn()
    vi.mocked(express.static).mockReturnValueOnce(first as never)
    vi.mocked(express.static).mockReturnValueOnce(second as never)

    const service = new StaticServerLauncher({
        folders: [
            { mount: 'foo', path: 'bar' },
            { mount: 'foo2', path: 'bar2' }
        ],
        port: 1234
    })
    await service.onPrepare({})

    expect(express).toHaveBeenCalledTimes(1)
    expect(express.static).toHaveBeenNthCalledWith(1, 'bar')
    expect(express.static).toHaveBeenNthCalledWith(2, 'bar2')
    expect(server.use).toHaveBeenNthCalledWith(1, 'foo', first)
    expect(server.use).toHaveBeenNthCalledWith(2, 'foo2', second)
    expect(server.listen).toHaveBeenCalledWith(1234, expect.any(Function))
})

test('should stream logs to log dir', async () => {
    const stream = { write: vi.fn() }
    const logMiddleware = vi.fn()
    vi.mocked(fs.createWriteStream).mockReturnValueOnce(stream as never)
    vi.mocked(morgan).mockReturnValueOnce(logMiddleware as never)

    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' }
    })
    await service.onPrepare({ outputDir: '/foo/bar' })

    expect(fs.createWriteStream).toHaveBeenCalledWith(
        path.join('/foo/bar', 'wdio-static-server-service.log')
    )
    expect(morgan).toHaveBeenCalledWith(expect.any(String), { stream })
    expect(server.use).toHaveBeenCalledWith(logMiddleware)
})

test('should register middlewares', async () => {
    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' },
        middleware: [{ mount: 'other', middleware: 'bar' }]
    })
    await service.onPrepare({})
    expect(server.use).toHaveBeenCalledWith('other', 'bar')
})

test('should not export a worker service', () => {
    const entry = StaticServerEntry as unknown as Record<string, unknown>
    expect(typeof entry.launcher).toBe('function')
    expect(typeof entry.default).not.toBe('function')
})
