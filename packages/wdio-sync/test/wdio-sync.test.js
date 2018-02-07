import {
    // wdioSync,
    runInFiberContext,
    executeHooksWithArgs
} from '../src'

describe('wdio-sync', () => {
    describe('executeHooksWithArgs', () => {
        let hook1, hook2, hook3

        beforeAll(() => {
            hook1 = jest.fn()
            hook2 = jest.fn()
            hook3 = jest.fn()
        })

        it('should execute all hooks with same parameters', () => {
            executeHooksWithArgs([hook1, hook2, hook3], [1, 2, 3, 4])
            expect(hook1.calledWith(1, 2, 3, 4)).toBe(true)
            expect(hook2.calledWith(1, 2, 3, 4)).toBe(true)
            expect(hook3.calledWith(1, 2, 3, 4)).toBe(true)
        })

        it('should respect promises', async () => {
            let hook = () => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve('done'), 1000)
                })
            }
            let start = new Date().getTime()
            let result = await executeHooksWithArgs([hook])
            let duration = new Date().getTime() - start
            expect(duration).toBeGreaterThan(990)
            expect(result[0]).toBe('done')
        })

        it('should allow func parameter', async () => {
            let hook = () => 'done'
            let result = await executeHooksWithArgs(hook)
            expect(result[0]).toBe('done')
        })

        describe('error handling', () => {
            describe('sync', () => {
                beforeAll(() => {
                    global.browser = { options: { sync: true } }
                })

                it('should skip if hook returns rejected promise', async () => {
                    let hookReject = () => new Promise((resolve, reject) => reject(new Error('buu')))
                    const res = await executeHooksWithArgs(hookReject)
                    expect(res[0]).toBeInstanceOf(Error)
                    expect(res[0]).toBe('buu')
                })

                it('should skip immediate errors in hooks', async () => {
                    let hookThrows = () => { throw new Error('buu') }
                    const res = await executeHooksWithArgs(hookThrows)
                    expect(res[0]).toBeInstanceOf(Error)
                    expect(res[0]).toBe('buu')
                })

                afterAll(() => {
                    delete global.browser
                })
            })

            describe('async', () => {
                it('should skip if hook returns rejected promise', async () => {
                    let hookReject = () => new Promise((resolve, reject) => reject(new Error('buu')))
                    const res = await executeHooksWithArgs(hookReject)
                    expect(res[0]).toBeInstanceOf(Error)
                    expect(res[0]).toBe('buu')
                })

                it('should skip immediate errors in hooks', async () => {
                    let hookThrows = () => { throw new Error('buu') }
                    const res = await executeHooksWithArgs(hookThrows)
                    expect(res[0]).toBeInstanceOf(Error)
                    expect(res[0]).toBe('buu')
                })
            })
        })
        //
        // afterAll(() => {
        //     /**
        //      * reset globals
        //      */
        //     WDIOSyncRewire.__Rewire__('commandIsRunning', false)
        //     WDIOSyncRewire.__Rewire__('forcePromises', false)
        // })
    })

    // describe('wdioSync', () => {
    //     let FiberMock = jest.fn()
    //     let run = jest.fn()
    //     FiberMock.mockReturnValue({
    //         run: run
    //     })
    //
    //     beforeAll(() => {
    //         WDIOSyncRewire.__Rewire__('Fiber', FiberMock)
    //     })
    //
    //     it('should be registered globally', () => {
    //         (Boolean(global.wdioSync)).should.be.true()
    //     })
    //
    //     it('should initiate Fiber context', (done) => {
    //         process.nextTick(wdioSync((a) => {
    //             FiberMock.called.should.be.true()
    //             run.called.should.be.true()
    //             a.should.be.equal('done')
    //             done()
    //         }).bind(null, 'done'))
    //         process.nextTick(() => FiberMock.callArg(0))
    //     })
    //
    //     after(() => {
    //         WDIOSyncRewire.__ResetDependency__('Fiber')
    //     })
    // })

    describe('runInFiberContext', () => {
        beforeEach(() => {
            global.fakeBefore = (cb) => cb()
            global.fakeGenericHookFn = (hookFn) => hookFn({prop: true}, () => {})
            global.fakeGenericSpecFn = (specTitle, specFn) => specFn(() => {}, {prop: true})
        })

        afterEach(() => {
            delete global.fakeBefore
            delete global.fakeGenericHookFn
            delete global.fakeGenericSpecFn
        })

        it('should run function in fiber context', () => {
            runInFiberContext(['it'], [], [], 'fakeBefore')
            fakeBefore(function async () {}) // eslint-disable-line no-undef
        })

        it('should pass synchronous error from fiber context', async () => {
            let error
            runInFiberContext(['it'], [], [], 'fakeBefore')
            try {
                await fakeBefore(function async () { throw new Error('buu') }) // eslint-disable-line no-undef
            } catch (e) {
                error = e
            }
            expect(error.message).toBe('buu')
        })

        it('should replace original function in global scope', () => {
            const origFakeBefore = global.fakeBefore
            runInFiberContext(['it'], [], [], 'fakeBefore')
            expect(global.fakeBefore).not.toBe(origFakeBefore)
        })

        it('should replace original function in custom scope', () => {
            const scope = { fakeAfter: (cb) => cb() }

            const origFakeBefore = global.fakeBefore
            const origFakeAfter = scope.fakeAfter

            runInFiberContext(['it'], [], [], 'fakeAfter', scope)

            expect(global.fakeBefore).toBe(origFakeBefore)
            expect(!global.fakeAfter).toBe(true)
            expect(scope.fakeAfter).not.toBe(origFakeAfter)
        })

        it('should pass filtered hook arguments to a hook function', async () => {
            runInFiberContext(['fakeGenericSpecFn'], [], [], 'fakeGenericHookFn')
            let wasRun = false
            await fakeGenericHookFn((...hookArgs) => { // eslint-disable-line no-undef
                expect(hookArgs.length).toBe(1)
                hookArgs[0].should.have.keys('prop')
                wasRun = true
            })
            expect(wasRun).toBe(true)
        })

        it('should pass filtered spec arguments to a spec function', async () => {
            runInFiberContext(['fakeGenericSpecFn'], [], [], 'fakeGenericSpecFn')
            let wasRun = false
            await fakeGenericSpecFn('specTitle', (...specArgs) => { // eslint-disable-line no-undef
                expect(specArgs.length).toBe(1)
                specArgs[0].should.have.keys('prop')
                wasRun = true
            })
            expect(wasRun).toBe(true)
        })
    })
})
