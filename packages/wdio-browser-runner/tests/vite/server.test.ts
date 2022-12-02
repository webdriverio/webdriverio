import path from 'node:path'
import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest'
import { createServer } from 'vite'
import { executeHooksWithArgs } from '@wdio/utils'

import { ViteServer } from '../../src/vite/server.js'
import { MESSAGE_TYPES, SESSIONS, BROWSER_POOL } from '../../src/constants.js'

vi.mock('../../src/vite/plugins/testrunner.js', () => ({
    testrunner: vi.fn().mockReturnValue('testrunner plugin')
}))
vi.mock('../../src/vite/constants.js', () => ({
    DEFAULT_VITE_CONFIG: { someDefault: 'config' },
    PRESET_DEPENDENCIES: { lit: ['foobar', 'default', { bar: 'foo' }] }
}))
vi.mock('@wdio/utils', () => ({
    executeHooksWithArgs: vi.fn().mockResolvedValue('hook result')
}))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('ws', () => ({
    WebSocketServer: class {
        on = vi.fn()
    }
}))
vi.mock('foobar', () => ({ default: vi.fn().mockReturnValue('foobar') }))
vi.mock('vite')
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

const consoleLog = console.log.bind(console)

describe('ViteServer', () => {
    beforeEach(() => {
        console.log = vi.fn()
    })

    it('constructor throws if preset and viteConfig is set at the same time', () => {
        expect(() => new ViteServer({
            preset: 'lit',
            viteConfig: {}
        })).toThrow()
    })

    it('constructor sets config properly', () => {
        const server = new ViteServer({
            viteConfig: { foo: 'bar' } as any
        })
        expect(server.config).toEqual({
            foo: 'bar',
            plugins: ['testrunner plugin'],
            root: expect.any(String),
            someDefault: 'config'
        })
    })

    it('start', async () => {
        const server = new ViteServer({
            viteConfig: { foo: 'bar' } as any
        })
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            foo: 'bar',
            plugins: ['testrunner plugin'],
            root: expect.any(String),
            server: {
                port: 1234,
                proxy: {
                    '/ws': {
                        target: 'ws://localhost:1234',
                        ws: true
                    }
                }
            },
            someDefault: 'config'
        })
    })

    it('start with a preset', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            plugins: ['testrunner plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 1234,
                proxy: {
                    '/ws': {
                        target: 'ws://localhost:1234',
                        ws: true
                    }
                }
            },
            someDefault: 'config'
        })
    })

    it('connect/close', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        await server.close()
        expect(viteServer.close).toBeCalledTimes(1)
        expect(ws.close).toBeCalledTimes(1)
    })

    it('handleConsole when parsing fails', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        vi.mocked(ws.on).mock.calls[0][1](Buffer.from('foobar'))
        expect(vi.mocked(ws.send).mock.calls[0][0]).toContain('Failed handling socket message')
    })

    it('handleConsole', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.consoleMessage,
            value: {
                name: 'consoleEvent',
                cid: '1-2',
                args: ['foo', 'bar'],
                type: 'log'
            }
        })))
        expect(console.log).toBeCalledWith('[1-2]', 'foo', 'bar')
    })

    it('handleConsole but not wdio logs', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.consoleMessage,
            value: {
                name: 'consoleEvent',
                cid: '1-2',
                args: ['[WDIO] foo', 'bar'],
                type: 'log'
            }
        })))
        expect(console.log).toBeCalledTimes(0)
    })

    it('hookTriggerMessage fails if no session found', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.hookTriggerMessage,
            value: {
                name: 'before',
                cid: '1-2',
                args: ['[WDIO] foo', 'bar']
            }
        })))
        expect(JSON.parse(ws.send.mock.calls[0] as any as string).value.error.message)
            .toBe('No session for cid 1-2 found!')
    })

    it('hookTriggerMessage runs hook if session found', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        const session: any = { config: { before: vi.fn().mockReturnValue(123) } }
        SESSIONS.set('1-2', session)

        const payload = {
            type: MESSAGE_TYPES.hookTriggerMessage,
            value: {
                name: 'before',
                cid: '1-2',
                args: ['foo', 'bar']
            }
        }
        await vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify(payload)))
        expect(executeHooksWithArgs).toBeCalledWith(
            'before',
            session.config.before,
            ['foo', 'bar']
        )
        expect(ws.send).toBeCalledWith(JSON.stringify({
            type: MESSAGE_TYPES.hookResultMessage,
            value: payload.value
        }))
    })

    it('handleCommand fails if no cid given', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: {
                id: 123,
                commandName: '$',
                args: ['#elem']
            }
        })))
        expect(JSON.parse(ws.send.mock.calls[0] as any as string).value.error.message)
            .toBe('No "cid" property passed into command message with id "123"')
    })

    it('handleCommand fails if no browser with cid given', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        await vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: {
                id: 123,
                cid: '1-2',
                commandName: '$',
                args: ['#elem']
            }
        })))
        expect(JSON.parse(ws.send.mock.calls[0] as any as string).value.error.message)
            .toBe('Couldn\'t find browser with cid "1-2"')
    })

    it('handleCommand can execute command', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        const browser: any = { '$': vi.fn().mockResolvedValue('some result') }
        BROWSER_POOL.set('1-2', browser)
        await vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: {
                id: 123,
                cid: '1-2',
                commandName: '$',
                args: ['#elem']
            }
        })))
        expect(browser['$']).toBeCalledWith('#elem')
        expect(JSON.parse(ws.send.mock.calls[0] as any as string)).toEqual({
            type: MESSAGE_TYPES.commandResponseMessage,
            value: { id: 123, result: 'some result' }
        })
    })

    it('handleCommand emits debug state change', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        const browser: any = { debug: vi.fn(), emit: vi.fn() }
        BROWSER_POOL.set('1-2', browser)
        await vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: {
                id: 123,
                cid: '1-2',
                commandName: 'debug',
                args: []
            }
        })))
        expect(browser.debug).toBeCalledTimes(1)
        expect(browser.emit).toBeCalledTimes(2)
        expect(browser.emit).toBeCalledWith('debugState', true)
        expect(browser.emit).toBeCalledWith('debugState', false)
    })

    it('handleCommand can execute command that fails', async () => {
        const server = new ViteServer({
            preset: 'lit'
        })
        const viteServer = { listen: vi.fn(), close: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        const ws = { on: vi.fn(), close: vi.fn(), send: vi.fn() }
        // @ts-ignore
        vi.mocked(server.socketServer)!.on.mock.calls[0][1](ws)
        const commandError = new Error('ups')
        const browser: any = { '$': vi.fn().mockRejectedValue(commandError) }
        BROWSER_POOL.set('1-2', browser)
        await vi.mocked(ws.on).mock.calls[0][1](Buffer.from(JSON.stringify({
            type: MESSAGE_TYPES.commandRequestMessage,
            value: {
                id: 123,
                cid: '1-2',
                commandName: '$',
                args: ['#elem']
            }
        })))
        expect(browser['$']).toBeCalledWith('#elem')
        expect(JSON.parse(ws.send.mock.calls[0] as any as string)).toEqual({
            type: MESSAGE_TYPES.commandResponseMessage,
            value: {
                error: {
                    message: 'Failed to execute command "$": ups',
                    name: 'Error',
                    stack: expect.any(String)
                },
                id: 123
            }
        })
    })

    afterEach(() => {
        vi.mocked(createServer).mockClear()
        console.log = consoleLog
    })
})
