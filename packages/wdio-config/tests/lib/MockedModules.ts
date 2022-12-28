import { vi } from 'vitest'

import type { ModuleImportService } from '../../src/index.js'

/**
 * Test implementation of ModuleImportService
 *
 * Avoids the SUT from actually requiring files at all, instead using a small in-memory array representing virtual
 * modules present in a virtual node_modules for the SUT.
 *
 * Normally will never call the real require functions and will throw if SUT requires something not mocked.
 * Provide callThroughNotMockedModules as true to call through to real require function when not mocked instead of throwing.
 */
export default class MockedModules implements ModuleImportService {
    mockLoadedModules: Record<string, any>
    requireMock: Function
    resolveMock: Function

    private constructor(callThroughNotMockedModules = false) {
        this.mockLoadedModules = {}
        this.requireMock = vi.fn((m:string) => {
            try {
                return this.getModule(m)
            } catch (err: any) {
                if ( callThroughNotMockedModules ) {
                    return require(m)
                }
                throw err

            }
        })
        this.resolveMock = vi.fn((m:string) => {
            try {
                return this.hasModule(m)
            } catch (err: any) {
                if ( callThroughNotMockedModules ) {
                    return require.resolve(m)
                }
                throw err

            }
        })
    }

    static withNoModules(callThroughNotMockedModules = false) {
        return new MockedModules(callThroughNotMockedModules)

    }

    static withModules(moduleAndValuesList: [string, any][], callThroughNotMockedModules = false) {
        const instance = new MockedModules(callThroughNotMockedModules)
        return instance.withModules(moduleAndValuesList)
    }

    /**
     * Use the mocks if interested in low-level calls being made.
     *
     * A mock for each aspect of ModuleImportService is provided.
     */
    getMocks() {
        return {
            requireMock: this.requireMock,
            resolveMock: this.resolveMock
        }
    }

    withModules(moduleAndValuesList: [string, any][]) {
        for (const [moduleName, moduleValue] of moduleAndValuesList) {
            this.withModule(moduleName, moduleValue)
        }
        return this
    }

    withModule(module: string, mockModule: any) {
        this.mockLoadedModules[module] = mockModule
        return this
    }
    doesNotHaveModule(module: string) {
        this.mockLoadedModules[module] = undefined
        delete this.mockLoadedModules[module]
        return this
    }
    resetModules() {
        this.mockLoadedModules = []
    }

    withTsNodeModule(registerMock = vi.fn()) {
        return this.withModule(
            'ts-node', { register: registerMock }
        )
    }

    withTsconfigPathModule(registerMock = vi.fn()) {
        return this.withModule(
            'tsconfig-paths', { register: registerMock }
        )
    }

    withBabelModule(registerMock = vi.fn()) {
        return this.withModule('@babel/register', registerMock)
    }

    // Helpers for resembling real implementation behavior respective to tests
    private getModule(module: string) {
        if (this.hasModule(module)) {
            return this.mockLoadedModules[module]
        }
        throw new Error('FAKE_MODULE_NOT_FOUND')
    }
    private hasModule(module: string) {
        if (this.mockLoadedModules[module]) {
            return true
        }
        throw new Error('FAKE_MODULE_NOT_FOUND')
    }

    // Interface
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    import <T>(module: string): Promise<T> {
        // forward to vi mock
        return this.requireMock.apply(this, arguments)
    }
}
