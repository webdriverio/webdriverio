export default class MochaMock {
    loadFiles = jest.fn()
    loadFilesAsync = jest.fn()
    reporter = jest.fn()
    fullTrace = jest.fn()
    addFile = jest.fn()
    run = jest.fn()

    mockFailureCount: number
    suite: { on: jest.Mock }
    runner: {
        on: jest.Mock
        suite: any
        test: string
    }

    constructor (private mochaOpts) {
        this.suite = {
            on: jest.fn()
        }

        this.runner = {
            on: jest.fn(),
            suite: {
                beforeAll: jest.fn(),
                beforeEach: jest.fn(),
                afterEach: jest.fn(),
                afterAll: jest.fn(),
                suites: ['first suite']
            },
            test: 'some test'
        }

        this.mockFailureCount = mochaOpts.mockFailureCount || 0
        this.run = jest.fn().mockImplementation((cb) => {
            if (mochaOpts.mockRuntimeError) {
                throw mochaOpts.mockRuntimeError
            }

            cb(this.mockFailureCount)
            return this.runner
        })
    }

    static Runner = jest.fn().mockImplementation(function (total) {
        return { grep: jest.fn(), total }
    })
}
