import WDIOReporter from '../src'
import tmp from 'tmp'
import TestStats from '../src/stats/test'

describe('WDIOReporter Listeners', () => {
    let reporter

    beforeEach(() => {
        const tmpobj = tmp.fileSync()
        reporter = new WDIOReporter({ logFile: tmpobj.name })
    })

    describe('Pending Listener', () => {
        let stat
        let spy
        let spy2

        beforeEach(() => {
            spy = jest.spyOn(WDIOReporter.prototype, 'onTestSkip')
            spy2 = jest.spyOn(TestStats.prototype, 'skip')
            stat = {
                type: 'test:start',
                title: 'should can do something',
                parent: 'My awesome feature',
                fullTitle: 'My awesome feature should can do something',
                pending: false,
                cid: '0-0',
                specs: ['/path/to/test/specs/sync.spec.js'],
                uid: '0-0'
            }

            stat.complete = jest.fn()
        })

        afterEach(() => {
            spy.mockClear()
            spy2.mockClear()
        })

        it('should add a pending test to the test list', () => {
            reporter.emit('test:pending', stat)
            expect(reporter.tests).toHaveProperty(stat.uid)
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(1)
            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)
        })

        it('should allow Mocha pending tests with same UID to be added to other tests ', () => {
            const stats = []
            stats.push({ ...stat, uid: '0-0-0' })
            stats.push({ ...stat, uid: '0-0-1' })
            stats.push({ ...stat, uid: '0-0-2' })
            stats.push({ ...stat, uid: '0-0-3' })

            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])

            // If new uid is not generated for pending test
            reporter.emit('test:pending', stats[1])
            reporter.emit('test:pending', stats[1])

            reporter.emit('test:pending', stats[2])
            reporter.emit('test:pending', stats[3])

            expect(spy).toHaveBeenCalledTimes(4)
            expect(spy2).toHaveBeenCalledTimes(4)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty('skipped-0')
            expect(reporter.tests).toHaveProperty('skipped-1')
            expect(reporter.tests).toHaveProperty(stats[2].uid)
            expect(reporter.tests).toHaveProperty(stats[3].uid)

            // Make sure there are only 4 tests
            expect(Object.keys(reporter.tests).length).toEqual(6)

            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests['skipped-0'].state).toEqual('skipped')
            expect(reporter.tests['skipped-1'].state).toEqual('skipped')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')
            expect(reporter.tests[stats[3].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(6)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual('skipped-0')
            expect(reporter.currentSuites[0].tests[3].uid).toEqual('skipped-1')
            expect(reporter.currentSuites[0].tests[4].uid).toEqual(stats[2].uid)
            expect(reporter.currentSuites[0].tests[5].uid).toEqual(stats[3].uid)

            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(4)
            expect(reporter.counts.tests).toEqual(6)
        })

        it('should allow Jasmine pending tests to be added to the test list', () => {
            const stats = []
            stats.push({ ...stat, uid: '0-0-0' })
            stats.push({ ...stat, uid: '0-0-1' })
            stats.push({ ...stat, uid: '0-0-2' })

            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])
            reporter.emit('test:start', stats[2])
            reporter.emit('test:pending', stats[2])

            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty(stats[2].uid)

            // Make sure there are only 3 tests
            expect(Object.keys(reporter.tests).length).toEqual(3)
            expect(reporter.tests).not.toHaveProperty('skipped-0')

            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(3)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual(stats[2].uid)

            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(3)
        })
    })

    describe('handling runner:start', () => {

        let runnerStartEvent

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            reporter.onRunnerStart = jest.fn()
        })

        it('should set the root suite id', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.currentSuites[0].cid).toBe(runnerStartEvent.cid)
        })

        it('should set the runner stat', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.runnerStat).toBeDefined()
            expect(reporter.runnerStat.capabilities).toEqual(runnerStartEvent.capabilities)
        })

        it('should call onRunnerStart', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.onRunnerStart).toBeCalledWith(reporter.runnerStat)
        })
    })

    describe('handling suite:start', () => {
        let suiteStartEvent
        let runnerStartEvent
        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            reporter.onSuiteStart = jest.fn()
        })

        it('should set the suite as sub suite of the current suite', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.currentSuites[0].suites.length).toBe(1)
            expect(reporter.currentSuites[0].suites[0].title).toBe(suiteStartEvent.title)
        })

        it('should add the suite to the stack of current suites', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.currentSuites.length).toBe(2)
            expect(reporter.currentSuites[1].title).toBe(suiteStartEvent.title)
        })

        it('should add the suite stats to the lookup object of suite stats', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.suites[suiteStartEvent.uid]).toBeDefined()
            expect(reporter.suites[suiteStartEvent.uid].title).toBe(suiteStartEvent.title)
        })

        it('should call onSuiteStart with the suite stat', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.onSuiteStart).toBeCalledWith(reporter.suites[suiteStartEvent.uid])
        })
    })

    describe('handling hook:start', () => {
        let hookStartEvent
        let suiteStartEvent
        let runnerStartEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('hook:start', hookStartEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            hookStartEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            }
        })

        it('should attach the hook stats to the current suite stats', () => {
            emitEvents()
            expect(reporter.currentSuites[1].hooks).toHaveLength(1)
            expect(reporter.currentSuites[1].hooks[0].uid).toEqual(hookStartEvent.uid)
        })

        it('should add the hook stats to the lookup object of hook stats', () => {
            emitEvents()
            expect(reporter.hooks[hookStartEvent.uid].title).toBe(hookStartEvent.title)
        })

        it('should call on hook start with the hook stat', () => {
            reporter.onHookStart = jest.fn()
            emitEvents()
            expect(reporter.onHookStart).toBeCalledWith(reporter.hooks[hookStartEvent.uid])
        })
    })

    describe('handling hook:end', () => {

        let hookEndEvent
        let hookStartEvent
        let suiteStartEvent
        let runnerStartEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('hook:start', hookStartEvent)
            reporter.emit('hook:end', hookEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            hookStartEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            }
            hookEndEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            }
        })

        it('should complete the hook if the hook passes', () => {
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid].state).not.toBe('failed')
        })

        it('should complete the hook if the hook if the hook passes and has an empty errors property', () => {
            hookEndEvent.errors = []
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid].state).not.toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid].error).toBeUndefined()
        })

        it('should complete the hook if the hook fails with a single error and mark it failed (Mocha-style)', () => {
            hookEndEvent.error = new Error('Boom')
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid].state).toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid].error.message).toBe('Boom')
            expect(reporter.hooks[hookStartEvent.uid].errors.length).toBe(1)
            expect(reporter.hooks[hookStartEvent.uid].errors[0].message).toBe('Boom')
        })

        it('should complete the hook if the hook fails with multiple errors and mark it failed (Jasmine-style)', () => {
            hookEndEvent.errors = [{ message: 'SoftFail' }, { message: 'anotherfail' }]
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid].state).toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid].error.message).toBe('SoftFail')
            expect(reporter.hooks[hookStartEvent.uid].errors.length).toBe(2)
            expect(reporter.hooks[hookStartEvent.uid].errors[0].message).toBe('SoftFail')
            expect(reporter.hooks[hookStartEvent.uid].errors[1].message).toBe('anotherfail')
        })

        it('should call onHookEnd with the hook stats', () => {
            reporter.onHookEnd = jest.fn()
            emitEvents()

            expect(reporter.onHookEnd).toHaveBeenCalledWith(reporter.hooks[hookStartEvent.uid])
        })

        it('should increment the hook count', () => {
            emitEvents()
            expect(reporter.counts.hooks).toBe(1)
        })
    })

    describe('handling test:start', () => {

        let testStartEvent
        let suiteStartEvent
        let runnerStartEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            }
        })

        it('should add the test stat to the current suite stat', () => {
            emitEvents()
            expect(reporter.suites[suiteStartEvent.uid].tests.length).toBe(1)
            expect(reporter.suites[suiteStartEvent.uid].tests[0].title).toBe(testStartEvent.title)
        })

        it('should add the test stat to the lookup object of test stats', () => {
            emitEvents()
            expect(reporter.tests[testStartEvent.uid].title).toBe(testStartEvent.title)
        })

        it('should call onTestStart with the test stat', () => {
            reporter.onTestStart = jest.fn()
            emitEvents()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })

    describe('handling test:pass', () => {

        let testPassEvent
        let testStartEvent
        let suiteStartEvent
        let runnerStartEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:pass', testPassEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            }
            testPassEvent = {
                uid: 'testid',
            }
        })

        it('should flag the test stat as passed and complete', () => {
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('passed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
        })

        it('should increment the test and passes counts', () => {
            emitEvents()

            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(1)
        })

        it('should call onTestPass with the test stat', () => {
            reporter.onTestPass = jest.fn()
            emitEvents()

            expect(reporter.onTestPass).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })

    describe('handling test:fail', () => {

        let testStartEvent
        let testFailEvent
        let suiteStartEvent
        let runnerStartEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:fail', testFailEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the softare'
            }
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            }

            testFailEvent = {
                uid: 'testid'
            }
        })

        it('Should flag the test as failed and complete if the test somehow has no error', () => {
            emitEvents()
            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
        })

        it('shoud flag the test as failed and complete if the test has one error (Mocha style)', () => {
            testFailEvent.error = new Error('Boom')
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.tests[testStartEvent.uid].error.message).toBe('Boom')
            expect(reporter.tests[testStartEvent.uid].errors.length).toBe(1)
            expect(reporter.tests[testStartEvent.uid].errors[0].message).toBe('Boom')
        })

        it('should flag the test as failed and complete the test if the test has multiple errors (Jasmine style)', () => {
            testFailEvent.errors = [{ message: 'SoftFail' }, { message: 'anotherfail' }]
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.tests[testStartEvent.uid].error.message).toBe('SoftFail')
            expect(reporter.tests[testStartEvent.uid].errors.length).toBe(2)
            expect(reporter.tests[testStartEvent.uid].errors[0].message).toBe('SoftFail')
            expect(reporter.tests[testStartEvent.uid].errors[1].message).toBe('anotherfail')
        })

        it('should call onTestFail with the test stat', () => {
            reporter.onTestFail = jest.fn()
            emitEvents()

            expect(reporter.onTestFail).toBeCalledWith(reporter.tests[testStartEvent.uid])
        })

        it('Should increment the test and failure counts', () => {
            emitEvents()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.failures).toBe(1)
        })
    })

    describe('handling test:retry', () => {

        let runnerStartEvent
        let suiteStartEvent
        let testStartFirstEvent
        let testRetryEvent
        let testStartSecondEvent
        let testPassEvent
        let testFailEvent
        let testEndEvent

        const emitEventsFirstTry = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartFirstEvent)
            reporter.emit('test:retry', testRetryEvent)
        }

        const emitEventsSecondPassTry = () => {
            reporter.emit('test:start', testStartSecondEvent)
            reporter.emit('test:pass', testPassEvent)
            reporter.emit('test:end', testEndEvent)
        }

        const emitEventsSecondFailTry = () => {
            reporter.emit('test:start', testStartSecondEvent)
            reporter.emit('test:fail', testFailEvent)
            reporter.emit('test:end', testEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runner-id',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suite-id',
                title: 'the software'
            }
            testStartFirstEvent = {
                uid: 'test-id',
                title: 'should do the needful'
            }
            testRetryEvent = {
                uid: 'test-id'
            }
            testStartSecondEvent = {
                uid: 'test-retry-id',
                title: 'should do the needful'
            }
            testPassEvent = {
                uid: 'test-retry-id'
            }
            testFailEvent = {
                uid: 'test-retry-id'
            }
            testEndEvent = {
                uid: 'test-retry-id'
            }
        })

        it('should call test retry with the test stat', () => {
            reporter.onTestStart = jest.fn()
            reporter.onTestRetry = jest.fn()
            reporter.onTestFail = jest.fn()
            reporter.onTestEnd = jest.fn()

            emitEventsFirstTry()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartFirstEvent.uid])
            expect(reporter.onTestRetry).toHaveBeenCalledWith(reporter.tests[testRetryEvent.uid])

            emitEventsSecondFailTry()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartSecondEvent.uid])
            expect(reporter.onTestFail).toHaveBeenCalledWith(reporter.tests[testFailEvent.uid])
            expect(reporter.onTestEnd).toHaveBeenCalledWith(reporter.tests[testEndEvent.uid])
        })

        it('should update test retries count', () => {
            emitEventsFirstTry()
            expect(reporter.tests[testRetryEvent.uid].retries).toBe(0)

            emitEventsSecondFailTry()
            expect(reporter.tests[testEndEvent.uid].retries).toBe(1)
        })

        it('should increment the test and passes counts only after test retry', () => {
            emitEventsFirstTry()
            expect(reporter.counts.tests).toBe(0)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(0)

            emitEventsSecondPassTry()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(1)
            expect(reporter.counts.failures).toBe(0)
        })

        it('should increment the test and failure counts only after test retry', () => {
            emitEventsFirstTry()
            expect(reporter.counts.tests).toBe(0)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(0)

            emitEventsSecondFailTry()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(1)
        })
    })

    describe('handling test:end', () => {

        let testPassEvent
        let testStartEvent
        let suiteStartEvent
        let runnerStartEvent
        let testEndEvent

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:pass', testPassEvent)
            reporter.emit('test:end', testEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                }
            }
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            }
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            }
            testPassEvent = {
                uid: 'testid',
            },
            testEndEvent = {
                uid: 'testid'
            }
        })

        it('should call test end with the test stat', () => {
            reporter.onTestEnd = jest.fn()
            emitEvents()
            expect(reporter.onTestEnd).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })
})
