import { vi } from 'vitest'

export default class MochaMock {
    loadFiles = vi.fn()
    loadFilesAsync = vi.fn()
    reporter = vi.fn()
    fullTrace = vi.fn()
    addFile = vi.fn()
    run = vi.fn()

    mockFailureCount: number
    suite: { on: any }
    runner: {
        on: any
        suite: any
        test: any
    }

    constructor (private mochaOpts: any) {
        this.suite = {
            on: vi.fn()
        }

        this.runner = {
            on: vi.fn(),
            suite: {
                beforeAll: vi.fn(),
                beforeEach: vi.fn(),
                afterEach: vi.fn(),
                afterAll: vi.fn(),
                suites: [{ 'title': 'first suite' }]
            },
            test: { 'title': 'first test' }
        }

        this.mockFailureCount = mochaOpts.mockFailureCount || 0
        this.run = vi.fn().mockImplementation((cb) => {
            if (mochaOpts.mockRuntimeError) {
                throw mochaOpts.mockRuntimeError
            }

            cb(this.mockFailureCount)
            return this.runner
        })
    }

    static Runner = vi.fn().mockImplementation(function (total) {
        return { grep: vi.fn(), total }
    })
}
