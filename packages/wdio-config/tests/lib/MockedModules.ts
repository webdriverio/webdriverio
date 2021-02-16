import { ModuleRequireService } from '../../src'

/**
 * Test implementation of ModuleRequireService
 *
 * Avoids the SUT from actually requiring files at all, instead using a small in-memory array representing virtual
 * modules present in a virtual node_modules for the SUT.
 *
 * Normally will never call the real require functions and will throw if SUT requires something not mocked.
 * Provide callThroughNotMockedModules as true to call through to real require function when not mocked instead of throwing.
 */
export default class MockedModules implements ModuleRequireService {
    private constructor(callThroughNotMockedModules = false) {
        this.mockLoadedModules = []
        this.requireMock = jest.fn((m:string) => {
            try {
                return this.getModule(m)
            } catch (e) {
                if ( callThroughNotMockedModules ) {
                    return require(m)
                }
                throw e

            }
        })
        this.resolveMock = jest.fn((m:string) => {
            try {
                return this.hasModule(m)
            } catch (e) {
                if ( callThroughNotMockedModules ) {
                    return require.resolve(m)
                }
                throw e

            }
        })
    }

    static withNoModules(callThroughNotMockedModules = false) {
        return new MockedModules(callThroughNotMockedModules)

    }

    static withModules(moduleAndValuesList: [string, any][], callThroughNotMockedModules = false) {
        let instance = new MockedModules(callThroughNotMockedModules)
        return instance.withModules(moduleAndValuesList)
    }

    /**
     * Use the mocks if interested in low-level calls being made.
     *
     * A mock for each aspect of ModuleRequireService is provided.
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

    withTsNodeModule(registerMock = jest.fn()) {
        return this.withModule(
            'ts-node', { register: registerMock }
        )
    }

    withBabelModule(registerMock = jest.fn()) {
        return this.withModule('@babel/register', registerMock)
    }

    // Helpers for resembling real implementation behavior respective to tests
    private getModule(module: string) {
        if ( this.hasModule(module) ) {
            return this.mockLoadedModules[module]
        }
        throw new Error('FAKE_MODULE_NOT_FOUND')
    }
    private hasModule(module: string) {
        if ( this.mockLoadedModules[module] ) {
            return true
        }
        throw new Error('FAKE_MODULE_NOT_FOUND')
    }

    // Interface
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    require<T>(module: string): T {
        // forward to jest mock
        return this.requireMock.apply(this, arguments)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resolve(request: string, options: { paths?: string[] }): string {
        // forward to jest mock
        return this.resolveMock.apply(this, arguments)
    }

}
