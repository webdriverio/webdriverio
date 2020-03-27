import express from 'express'
import fs from 'fs-extra'
import os from 'os'

import StaticServerLauncher from '../src/launcher'

jest.mock('fs-extra')

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
    service.server.listen.mock.calls[0][1]()
    expect(express).toBeCalledTimes(1)
    expect(service.server.use).toBeCalledWith('foo', undefined)
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
    service.server.listen.mock.calls[0][1]()
    expect(express).toBeCalledTimes(1)
    expect(service.server.use).toBeCalledWith('foo', undefined)
    expect(express.static).toBeCalledWith('bar')
    expect(service.server.use).toBeCalledWith('foo2', undefined)
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

    expect(fs.createFileSync).toBeCalledWith(filename)
    expect(fs.createWriteStream).toBeCalledWith(filename)
})

test('should register middlewares', async () => {
    const service = new StaticServerLauncher({
        folders: { mount: 'foo', path: 'bar' },
        middleware: [{ mount: 'foo', middleware: 'bar' }]
    })
    await service.onPrepare({})
    expect(service.server.use).toBeCalledWith('foo', 'bar')
})

afterEach(() => {
    express.mockClear()
})
