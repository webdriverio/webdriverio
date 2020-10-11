global.requireFibers = true
global.requireFibers8 = true

const mockFibers = () => {
    jest.mock('fibers', () => {
        if (!global.requireFibers) {
            throw new Error('package not found')
        }
        return { version: 4 }
    })
    jest.mock('fibers/future', () => {
        if (!global.requireFibers) {
            throw new Error('package not found')
        }
        return { version: 4 }
    })
}

test('should load fibers 4', () => {
    mockFibers()
    const fibers = require('../src/fibers')
    expect(fibers.default.version).toBe(4)
})

test('should throw error if package can not be installed', () => {
    global.requireFibers = false
    jest.resetModules()
    mockFibers()
    expect(() => require('../src/fibers'))
        .toThrow(/No proper `fibers` package could be loaded/)
})

afterEach(() => {
    delete global.requireFibers
})
