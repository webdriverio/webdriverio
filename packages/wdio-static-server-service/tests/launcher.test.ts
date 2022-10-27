import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import express from 'express'
import { test, expect, vi, afterEach } from 'vitest'

import StaticServerLauncher from '../src/launcher.js'

vi.mock('fs')
vi.mock('express')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

test('should not start server when no mount folder is defined', async () => {
    const service = new StaticServerLauncher({})
    await service.onPrepare({})
    expect(express).toBeCalledTimes(0)
})

test('should be able to start server', async () => {
    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' }
    })
    await service.onPrepare({})
    expect(express).toBeCalledTimes(1)
    expect(service['_server']!.use).toBeCalledWith('foo', undefined)
    expect(express.static).toBeCalledWith('bar')
})

test('should be able to mount multiple folder', async () => {
    const service = new StaticServerLauncher({
        folders: [
            { mount: 'foo', path: 'bar' },
            { mount: 'foo2', path: 'bar2' }
        ]
    })
    await service.onPrepare({})
    expect(express).toBeCalledTimes(1)
    expect(service['_server']!.use).toBeCalledWith('foo', undefined)
    expect(express.static).toBeCalledWith('bar')
    expect(service['_server']!.use).toBeCalledWith('foo2', undefined)
    expect(express.static).toBeCalledWith('bar2')
})

test('should stream logs to log dir', async () => {
    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' }
    })
    await service.onPrepare({ outputDir: '/foo/bar' })

    let filename = '/foo/bar/wdio-static-server-service.log'
    if (os.platform() === 'win32') {
        filename = filename.split('/').join('\\')
    }

    expect(fs.createWriteStream).toBeCalledWith(filename)
})

test('should register middlewares', async () => {
    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' },
        middleware: [{ mount: 'foo', middleware: 'bar' }]
    })
    await service.onPrepare({})
    expect(service['_server']!.use).toBeCalledWith('foo', 'bar')
})

afterEach(() => {
    vi.mocked(express).mockClear()
})
