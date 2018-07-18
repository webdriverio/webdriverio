import fs from 'fs'

import WDIORunner from '../src'

jest.mock('fs')
jest.mock('util', () => ({ promisify: (fn) => fn }))

describe('wdio-runner', () => {
    describe('fetchDriverLogs', () => {
        it('not do anything if driver does not support log commands', async () => {
            const runner = new WDIORunner()
            global.browser = {}

            runner.configParser.getConfig = () => ({ logDir: '/foo/bar' })
            const result = await runner.fetchDriverLogs()
            expect(result).toBe(undefined)
        })

        it('should fetch logs', async () => {
            const runner = new WDIORunner()
            runner.cid = '0-1'

            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: (type) => Promise.resolve([`#1 ${type} log`, `#2 ${type} log`])
            }

            runner.configParser.getConfig = () => ({ logDir: '/foo/bar' })
            await runner.fetchDriverLogs()
            expect(fs.writeFile.mock.calls[0]).toEqual(['/foo/bar/wdio-0-1-foo.log', '"#1 foo log"\n"#2 foo log"', 'utf-8'])
            expect(fs.writeFile.mock.calls[1]).toEqual(['/foo/bar/wdio-0-1-bar.log', '"#1 bar log"\n"#2 bar log"', 'utf-8'])
            fs.writeFile.mockClear()
        })

        it('should not write to file if no logs exist', async () => {
            const runner = new WDIORunner()
            runner.cid = '0-1'

            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: () => Promise.resolve([])
            }

            runner.configParser.getConfig = () => ({ logDir: '/foo/bar' })
            await runner.fetchDriverLogs()
            expect(fs.writeFile.mock.calls).toHaveLength(0)
        })

        afterEach(() => {
            delete global.browser
        })
    })

    describe('initialiseServices', () => {
        it('should be able to add custom services', () => {
            const runner = new WDIORunner()
            const service = {
                before: jest.fn(),
                afterTest: jest.fn()
            }

            runner.initialiseServices({ services: [service] })
            expect(runner.configParser.addService.mock.calls).toHaveLength(1)
            expect(runner.configParser.addService.mock.calls[0][0]).toEqual(service)
        })

        it('should be able to add wdio services', () => {
            const runner = new WDIORunner()
            runner.initialiseServices({ services: ['foobar'] })
            expect(runner.configParser.addService.mock.calls).toHaveLength(1)

            const service = runner.configParser.addService.mock.calls[0][0]
            // check if /packages/wdio-config/tests/__mocks__/wdio-config.js how the mock looks like
            expect(typeof service.beforeSuite).toBe('function')
            expect(typeof service.afterCommand).toBe('function')
            // not defined method
            expect(typeof service.before).toBe('undefined')
        })
    })
})
