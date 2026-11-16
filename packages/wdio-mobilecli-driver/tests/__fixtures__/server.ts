import { vi } from 'vitest'

export const IOS_DEVICE = {
    id: '0564A930-7807-4EF8-A286-CE7515D26B69',
    name: 'iPhone 18 Pro',
    platform: 'ios',
    type: 'simulator',
    version: '27.0',
    state: 'online',
    model: 'com.apple.CoreSimulator.SimDeviceType.iPhone-18-Pro',
    screenSize: { width: 402, height: 874, scale: 3 }
}

export const ANDROID_DEVICE = {
    id: 'emulator-5554',
    name: 'Pixel 10',
    platform: 'android',
    type: 'emulator',
    version: '17',
    state: 'online',
    model: 'sdk_gphone64_arm64',
    screenSize: { width: 1080, height: 2424, scale: 1 }
}

type Handler = (params: Record<string, unknown>) => unknown

/**
 * an error that the mobilecli server answers with, see `sendJSONRPCError`
 * in `mobilecli/server/server.go`
 */
export class ServerError extends Error {
    constructor (public data: unknown, public code = -32000, message = 'Server error') {
        super(message)
    }
}

/**
 * Replace the global `fetch` with a mobilecli server that answers the given
 * methods. Returns the mock, to assert on the requests.
 */
export function mockServer (handlers: Record<string, Handler>) {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        const { id, method, params } = JSON.parse(init!.body as string)
        const handler = handlers[method]
        const respond = (body: object) => new Response(JSON.stringify({ jsonrpc: '2.0', id, ...body }))

        if (!handler) {
            return respond({ error: { code: -32601, message: 'Method not found', data: `Method '${method}' not found` } })
        }
        try {
            return respond({ result: await handler(params) })
        } catch (err) {
            const error = err as ServerError
            return respond({ error: { code: error.code, message: error.message, data: error.data } })
        }
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

/**
 * a server with the given devices online
 */
export function mockDevices (...devices: typeof IOS_DEVICE[]) {
    const find = (deviceId?: unknown) => {
        if (!deviceId && devices.length === 1) {
            return devices[0]
        }
        const device = devices.find((device) => device.id === deviceId)
        if (!device) {
            throw new ServerError(deviceId
                ? `error finding device: device not found: ${deviceId}`
                : `error finding device: multiple devices found (${devices.length}), please specify --device or MOBILECLI_DEVICE with one of: [${devices.map((device) => device.id).join(', ')}]`
            )
        }
        return device
    }

    return mockServer({
        'device.resolve': ({ deviceId }) => {
            const { id, platform, type } = find(deviceId)
            return { id, platform, type }
        },
        'device.info': ({ deviceId }) => ({ device: find(deviceId) })
    })
}

/**
 * the JSON-RPC requests that were sent to the server
 */
export function getRequests (fetchMock: ReturnType<typeof mockServer>) {
    return fetchMock.mock.calls.map(([, init]) => {
        const { method, params } = JSON.parse(init!.body as string)
        return { method, params }
    })
}
