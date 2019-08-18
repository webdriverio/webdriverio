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

    jest.mock('fibers_node_v8', () => {
        if (!global.requireFibers8) {
            throw new Error('package not found')
        }
        return { version: 3 }
    })
    jest.mock('fibers_node_v8/future', () => {
        if (!global.requireFibers8) {
            throw new Error('package not found')
        }
        return { version: 3 }
    })
}

test('should load fibers 4 if both are installed', () => {
    mockFibers()
    const fibers = require('../src/fibers')
    expect(fibers.default.version).toBe(4)
})

test('should fallback to fibers 3 if 4 can not be installed', () => {
    global.requireFibers = false
    jest.resetModules()
    mockFibers()

    const fibers = require('../src/fibers')
    expect(fibers.default.version).toBe(3)
})

test('should throw error if both can not be installed', () => {
    global.requireFibers8 = false
    jest.resetModules()
    mockFibers()
    expect(() => require('../src/fibers'))
        .toThrow(/No proper `fibers` package could be loaded/)
})
