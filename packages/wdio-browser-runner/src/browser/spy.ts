import type { MaybeMocked } from '@vitest/spy'

import type { MockFactoryWithHelper } from '../types'

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
export async function mock (path: string, factory?: MockFactoryWithHelper) {
    /**
     * mock calls without factory parameter should get removed from the source code
     * by the mock hoisting plugin
     */
    if (!factory || typeof factory !== 'function') {
        return
    }

    /**
     * parameter is added by hoisting plugin if factory comes with a parameter
     */
    const actualImport = arguments[2]

    const mockLocalFile = path.startsWith('/') || path.startsWith('./') || path.startsWith('../')
    const mockPath = mockLocalFile
        // use absolute path for local files without extension
        ? (new URL(resolveUrl(window.__wdioSpec__.split('/').slice(0, -1).join('/') + '/' + path))).pathname.replace(/\.[^/.]+$/, '')
        : path

    try {
        const resolvedMock = await factory(actualImport)
        window.__wdioMockCache__.set(mockPath, resolvedMock)
    } catch (err: unknown) {
        const error = err as Error
        throw new Error(`${ERROR_MESSAGE}\n${error.message}: ${error.stack}`)
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unmock(moduleName: string) {
    // NO-OP: call gets removed by recast
}

/**
 * utility helper for type conversions
 */
export function mocked<T>(item: T) { return item as any as MaybeMocked<T> }
