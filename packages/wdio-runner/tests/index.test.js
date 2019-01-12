import fs from 'fs'

import WDIORunner from '../src'

jest.mock('fs')
jest.mock('util', () => ({ promisify: (fn) => fn }))

jest.mock('../src/utils', () => ({
    initialiseInstance: jest.fn().mockImplementation((config, capabilities) => {
        if (!Object.keys(capabilities).length > 0) {
            throw new Error('failure')
        }
        return {
            $: jest.fn(),
            $$: jest.fn(),
            on: jest.fn(),
            sessionId: '123'
        }
    }),
    runHook: jest.fn()
}))

describe('wdio-runner', () => {
    describe('_initSession', () => {
        let runner

        beforeEach(() => {
            runner = new WDIORunner()
        })

        it('should not initialise session on failure', async () => {
            runner.emit = jest.fn()
            const browser = await runner._initSession({}, {})
            expect(browser).toBe(null)
            expect(runner.emit).toBeCalledTimes(1)
            expect(runner.emit).toHaveBeenCalledWith('error', new Error('failure'))
            expect(global.browser).toBeUndefined()
            expect(global.driver).toBeUndefined()
            expect(global.$).toBeUndefined()
            expect(global.$$).toBeUndefined()
        })

        it('should initialise session', async () => {
            const config = { foo: 'bar' }
            const browser = await runner._initSession(config, {
                browserName: 'chrome'
            })
            expect(browser.sessionId).toBe('123')
            expect(global.browser).toBe(browser)
            expect(global.driver).toBe(browser)
            global.$('element')
            expect(browser.$).toBeCalledTimes(1)
            expect(browser.$).toHaveBeenCalledWith('element')
            global.$$('elements')
            expect(browser.$$).toBeCalledTimes(1)
            expect(browser.$$).toHaveBeenCalledWith('elements')
        })

        afterEach(() => {
            delete global.browser
            delete global.driver
            delete global.$
            delete global.$$
        })
    })

    describe('_fetchDriverLogs', () => {
        let runner

        beforeEach(() => {
            runner = new WDIORunner()
        })

        it('not do anything if driver does not support log commands', async () => {
            global.browser = { sessionId: '123' }

            const result = await runner._fetchDriverLogs({ outputDir: '/foo/bar' })
            expect(result).toBe(undefined)
        })

        it('should fetch logs', async () => {
            runner.cid = '0-1'

            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: (type) => Promise.resolve([`#1 ${type} log`, `#2 ${type} log`]),
                sessionId: '123'
            }

            await runner._fetchDriverLogs({ outputDir: '/foo/bar' })
            expect(fs.writeFile.mock.calls[0]).toEqual(['/foo/bar/wdio-0-1-foo.log', '"#1 foo log"\n"#2 foo log"', 'utf-8'])
            expect(fs.writeFile.mock.calls[1]).toEqual(['/foo/bar/wdio-0-1-bar.log', '"#1 bar log"\n"#2 bar log"', 'utf-8'])
            fs.writeFile.mockClear()
        })

        it('should not write to file if no logs exist', async () => {
            runner.cid = '0-1'

            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: () => Promise.resolve([]),
                sessionId: '123'
            }

            await runner._fetchDriverLogs({ outputDir: '/foo/bar' })
            expect(fs.writeFile.mock.calls).toHaveLength(0)
        })

        afterEach(() => {
            delete global.browser
        })
    })

    describe('endSession', () => {
        let runner

        beforeEach(() => {
            runner = new WDIORunner()
            runner._shutdown = jest.fn()
        })

        it('should do nothing when triggered by run method without session', async () => {
            await runner.endSession()
            expect(runner._shutdown).toBeCalledTimes(0)
        })

        it ('should work normally when called after framework run', async () => {
            global.browser = {
                deleteSession: jest.fn(),
                sessionId: '123'
            }
            await runner.endSession()
            expect(global.browser.deleteSession).toBeCalledTimes(1)
            expect(!global.browser.sessionId).toBe(true)
            expect(runner._shutdown).toBeCalledTimes(0)
        })

        it('should wait for session to be created until shutting down', async () => {
            global.browser = {
                deleteSession: jest.fn()
            }
            setTimeout(() => {
                global.browser.sessionId = 123
            }, 200)

            const start = Date.now()
            await runner.endSession(true)
            const end = Date.now()

            expect(global.browser.deleteSession).toBeCalledTimes(1)
            expect(!global.browser.sessionId).toBe(true)
            expect(runner._shutdown).toBeCalledTimes(1)
            expect(end - start).toBeGreaterThanOrEqual(200)
        })

        afterEach(() => {
            delete global.browser
        })
    })
})
