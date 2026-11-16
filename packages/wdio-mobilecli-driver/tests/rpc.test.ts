import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { RpcClient, RpcError, getServerUrl } from '../src/rpc.js'
import { mockServer, ServerError } from './__fixtures__/server.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const URL = 'http://localhost:12000/rpc'

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getServerUrl', () => {
    it('defaults to where "mobilecli server start" listens', () => {
        expect(getServerUrl()).toBe(URL)
        expect(getServerUrl({})).toBe(URL)
    })

    it('uses the connection options of WebdriverIO', () => {
        expect(getServerUrl({ protocol: 'https', hostname: 'devices.example.com', port: 13000 }))
            .toBe('https://devices.example.com:13000/rpc')
        expect(getServerUrl({ path: '/' })).toBe(URL)
        expect(getServerUrl({ path: '/mobilecli' })).toBe('http://localhost:12000/mobilecli/rpc')
        expect(getServerUrl({ path: 'mobilecli/' })).toBe('http://localhost:12000/mobilecli/rpc')
    })
})

describe('RpcClient', () => {
    it('sends a JSON-RPC 2.0 request and returns the result', async () => {
        const fetchMock = mockServer({ 'server.info': () => ({ name: 'mobilecli', version: '1.0.23' }) })
        const rpc = new RpcClient(URL)

        expect(await rpc.call('server.info')).toEqual({ name: 'mobilecli', version: '1.0.23' })

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe(URL)
        expect(init).toEqual(expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }))
        expect(JSON.parse(init!.body as string)).toEqual({ jsonrpc: '2.0', id: 1, method: 'server.info', params: {} })
    })

    it('sends the parameters and counts the request ids', async () => {
        const fetchMock = mockServer({ 'device.info': () => ({}) })
        const rpc = new RpcClient(URL)

        await rpc.call('device.info', { deviceId: 'a' })
        await rpc.call('device.info', { deviceId: 'b' })

        expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(init!.body as string))).toEqual([
            { jsonrpc: '2.0', id: 1, method: 'device.info', params: { deviceId: 'a' } },
            { jsonrpc: '2.0', id: 2, method: 'device.info', params: { deviceId: 'b' } }
        ])
    })

    it('throws the reason that mobilecli puts in the data of an error', async () => {
        mockServer({
            'device.resolve': () => {
                throw new ServerError('error finding device: device not found: nope')
            }
        })

        const error = await new RpcClient(URL).call('device.resolve', { deviceId: 'nope' }).catch((err) => err)
        expect(error).toBeInstanceOf(RpcError)
        expect(error.message).toBe('error finding device: device not found: nope')
        expect(error.code).toBe(-32000)
        expect(error.method).toBe('device.resolve')
    })

    it('throws an error of the server that has other data or no data', async () => {
        mockServer({
            'with.object': () => {
                throw new ServerError({ reason: 'broken' }, -32602, 'Invalid params')
            },
            'without.data': () => {
                throw new ServerError(undefined, -32603, 'Internal error')
            }
        })
        const rpc = new RpcClient(URL)

        await expect(rpc.call('with.object')).rejects.toThrow('Invalid params: {"reason":"broken"}')
        await expect(rpc.call('without.data')).rejects.toThrow('Internal error')
        await expect(rpc.call('not.there')).rejects.toThrow('Method \'not.there\' not found')
    })

    it('says how to start the server if it can not be reached', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

        const error = await new RpcClient(URL).call('server.info').catch((err) => err)
        expect(error.message).toBe(
            'Could not reach the mobilecli server at http://localhost:12000/rpc. ' +
            'Install mobilecli ("npm install -g mobilecli") and start the server with "mobilecli server start".'
        )
        expect(error.cause).toEqual(new TypeError('fetch failed'))
    })

    it('says which call the server did not answer in time', async () => {
        vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
            init.signal!.addEventListener('abort', () => reject(init.signal!.reason))
        })))

        await expect(new RpcClient(URL, 20).call('device.info'))
            .rejects.toThrow('The mobilecli server at http://localhost:12000/rpc did not answer "device.info" within 20ms')
    })

    it('says which call the server did not answer in time if it stalls on the body', async () => {
        vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
            const body = new ReadableStream({
                start (controller) {
                    init.signal!.addEventListener('abort', () => controller.error(init.signal!.reason))
                }
            })
            return new Response(body)
        }))

        await expect(new RpcClient(URL, 20).call('device.info'))
            .rejects.toThrow('The mobilecli server at http://localhost:12000/rpc did not answer "device.info" within 20ms')
    })

    it('sends the configured headers with every request', async () => {
        const fetchMock = mockServer({ 'server.info': () => ({}) })
        const rpc = new RpcClient(URL, undefined, { Authorization: 'Bearer token', 'Content-Type': 'text/plain' })

        await rpc.call('server.info')

        expect(fetchMock.mock.calls[0][1]!.headers).toEqual({
            Authorization: 'Bearer token',
            'Content-Type': 'application/json'
        })
    })

    it('returns undefined for a method without a result, as mobilecli leaves it out', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"jsonrpc":"2.0","id":1}')))

        expect(await new RpcClient(URL).call('device.io.tap')).toBeUndefined()
    })

    it('says that the server is not mobilecli if the answer is not JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Not Found</html>', { status: 404 })))

        await expect(new RpcClient(URL).call('server.info')).rejects.toThrow(
            'The server at http://localhost:12000/rpc did not answer "server.info" with a JSON-RPC response (status 404). ' +
            'Is this a mobilecli server? Response: <html>Not Found</html>'
        )
    })

    it('shows the answer of a server that fails with JSON that is not JSON-RPC', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"Bad Gateway"}', { status: 502 })))
        const rpc = new RpcClient(URL)

        await expect(rpc.call('device.resolve')).rejects.toThrow(
            'The server at http://localhost:12000/rpc did not answer "device.resolve" with a JSON-RPC response (status 502). ' +
            'Is this a mobilecli server? Response: {"message":"Bad Gateway"}'
        )

        vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"ok"}')))
        await expect(rpc.call('device.resolve')).rejects.toThrow('did not answer "device.resolve" with a JSON-RPC response (status 200)')

        vi.stubGlobal('fetch', vi.fn(async () => new Response('{"jsonrpc":"2.0","id":1}', { status: 502 })))
        await expect(rpc.call('device.resolve')).rejects.toThrow('did not answer "device.resolve" with a JSON-RPC response (status 502)')
    })

    it('throws the error of mobilecli whatever the status of the response is', async () => {
        const body = '{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"Server error","data":"device is offline"}}'
        vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 500 })))

        await expect(new RpcClient(URL).call('device.info')).rejects.toThrow('device is offline')
    })
})
