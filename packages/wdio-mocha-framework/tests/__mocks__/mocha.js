export default class MochaMock {
    constructor (mochaOpts) {
        this.mochaOpts = mochaOpts

        this.loadFiles = jest.fn()
        this.loadFilesAsync = jest.fn()
        this.reporter = jest.fn()
        this.fullTrace = jest.fn()
        this.addFile = jest.fn()

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
}

MochaMock.Runner = jest.fn().mockImplementation(function (total) {
    return { grep: jest.fn(), total }
})
