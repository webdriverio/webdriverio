import path from 'node:path'

import type { Options } from '@wdio/types'

import { getManualMocks } from './utils.js'
import { DEFAULT_MOCK_DIRECTORY, DEFAULT_AUTOMOCK } from '../constants.js'
import type { MockRequestEvent } from './types'

const FIXTURE_PREFIX = '/@fixture/'

export class MockHandler {
    #automock: boolean
    #automockDir: string
    #manualMocksList: Promise<[string, string][]>
    #mocks = new Map<string, MockRequestEvent>()
    #unmocked: string[] = []

    manualMocks: string[] = []

    constructor (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
        this.#automock = typeof options.automock === 'boolean' ? options.automock : DEFAULT_AUTOMOCK
        this.#automockDir = path.resolve(config.rootDir!, options.automockDir || DEFAULT_MOCK_DIRECTORY)
        this.#manualMocksList = getManualMocks(this.#automockDir)
    }

    get mocks () {
        return this.#mocks
    }

    addMock (mock: MockRequestEvent) {
        this.#mocks.set(mock.path, mock)
    }

    unmock (moduleName: string) {
        this.#unmocked.push(moduleName)
    }

    async resolveId (id: string) {
        const manualMocksList = await this.#manualMocksList
        const mockPath = manualMocksList.find((m) => (
            // e.g. someModule
            id === m[1].replace(path.sep, '/') ||
            // e.g. @some/module
            id.slice(1) === m[1].replace(path.sep, '/')
        ))

        /**
         * return manual mock if `automock` is enabled or a manual mock was set via `mock('module')`
         */
        if ((this.manualMocks.includes(id) || this.#automock) && mockPath && !this.#unmocked.includes(id)) {
            return mockPath[0]
        }

        /**
         * return fixture
         */
        if (id.startsWith(FIXTURE_PREFIX)) {
            return path.resolve(this.#automockDir, id.slice(FIXTURE_PREFIX.length))
        }
    }

    /**
     * reset manual mocks between tests
     */
    resetMocks () {
        this.manualMocks = []
        this.#unmocked = []
    }
}
