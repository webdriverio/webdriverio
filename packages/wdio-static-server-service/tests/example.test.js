import express from 'express'
import fs from 'fs-extra'
import os from 'os'

import StaticServerLauncher from '../src/launcher'

jest.mock('fs-extra')

test('should not start server when no mount folder is defined', () => {
    const service = new StaticServerLauncher()
    service.onPrepare({})
    expect(express).toBeCalledTimes(0)
})

test('should be able to start server', () => {
    const service = new StaticServerLauncher()
    service.onPrepare({
        staticServerFolders: { mount: 'foo', path: 'bar' }
    })
    service.server.listen.mock.calls[0][1]()
    expect(express).toBeCalledTimes(1)
    expect(service.server.use).toBeCalledWith('foo', undefined)
    expect(express.static).toBeCalledWith('bar')
})

test('should be able to mount multiple folder', () => {
    const service = new StaticServerLauncher()
    service.onPrepare({
        staticServerFolders: [
            { mount: 'foo', path: 'bar' },
            { mount: 'foo2', path: 'bar2' }
        ]
    })
    service.server.listen.mock.calls[0][1]()
    expect(express).toBeCalledTimes(1)
    expect(service.server.use).toBeCalledWith('foo', undefined)
    expect(express.static).toBeCalledWith('bar')
    expect(service.server.use).toBeCalledWith('foo2', undefined)
    expect(express.static).toBeCalledWith('bar2')
})

test('should stream logs to log dir', () => {
    const service = new StaticServerLauncher()
    service.onPrepare({
        staticServerFolders: { mount: 'foo', path: 'bar' },
        outputDir: '/foo/bar'
    })

    let filename = '/foo/bar/wdio-static-server-service.log'
    if (os.platform() === 'win32') {
        filename = filename.split('/').join('\\')
    }

    expect(fs.createFileSync).toBeCalledWith(filename)
    expect(fs.createWriteStream).toBeCalledWith(filename)
})

test('should register middlewares', () => {
    const service = new StaticServerLauncher()
    service.onPrepare({
        staticServerFolders: { mount: 'foo', path: 'bar' },
        staticServerMiddleware: [{ mount: 'foo', middleware: 'bar' }]
    })
    expect(service.server.use).toBeCalledWith('foo', 'bar')
})

afterEach(() => {
    express.mockClear()
})
