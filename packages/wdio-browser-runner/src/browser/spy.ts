import type { MaybeMocked } from '@vitest/spy'

import { MESSAGE_TYPES } from '../constants.js'
import type { MockFactoryWithHelper } from '../types'
import type { SocketMessage, SocketMessagePayload } from '../vite/types'

/**
 * re-export mock module
 */
export * from '@vitest/spy'

const a = document.createElement('a')
function resolveUrl(path: string) {
    a.href = path
    return a.href
}

const ERROR_MESSAGE = '[wdio] There was an error, when mocking a module. If you are using the "mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://webdriver.io/docs/component-testing/mocking'
const socket = window.__wdioSocket__
const mockResolver = new Map<string, (value: unknown) => void>()
const origin = window.__wdioSpec__.split('/').slice(0, -1).join('/')
window.__wdioMockFactories__ = []
export async function mock (path: string, factory?: MockFactoryWithHelper) {
    /**
     * mock calls without factory parameter should get removed from the source code
     * by the mock hoisting plugin
     */
    if (!factory) {
        return
    }

    const mockLocalFile = path.startsWith('/') || path.startsWith('./') || path.startsWith('../')
    const mockPath = mockLocalFile
        ? (new URL(resolveUrl(window.__wdioSpec__.split('/').slice(0, -1).join('/') + '/' + path))).pathname
        : path

    try {
        const resolvedMock = await factory(() => (
            import(mockLocalFile ? `/@mock${mockPath}` : `/node_modules/.vite/deps/${mockPath.replace('/', '_')}.js`)
        ))
        socket.send(JSON.stringify(<SocketMessage>{
            type: MESSAGE_TYPES.mockRequest,
            value: { path: mockPath, origin, namedExports: Object.keys(resolvedMock) }
        }))

        window.__wdioMockFactories__[mockPath] = resolvedMock
        return new Promise((resolve) => mockResolver.set(mockPath, resolve))
    } catch (err: unknown) {
        throw new Error(ERROR_MESSAGE + '\n' + (err as Error).stack)
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unmock(moduleName: string) {
    // NO-OP: call gets removed by recast
}

socket.addEventListener('message', (ev) => {
    try {
        const { type, value } = JSON.parse(ev.data) as SocketMessagePayload<MESSAGE_TYPES.mockResponse>
        const resolver = mockResolver.get(value.path)
        if (type !== MESSAGE_TYPES.mockResponse || !resolver) {
            return
        }
        return resolver(null)
    } catch {
        // ignore
    }
})

/**
 * utility helper for type conversions
 */
export function mocked<T>(item: T) { return item as any as MaybeMocked<T> }
