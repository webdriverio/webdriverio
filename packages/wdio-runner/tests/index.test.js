import fs from 'fs'

import WDIORunner from '../src'

jest.mock('fs', () => ({ writeFile: jest.fn() }))
jest.mock('util', () => ({ promisify: (fn) => fn }))

describe('wdio-runner', () => {
    describe('fetchDriverLogs', () => {
        it('not do anything if driver does not support log commands', async () => {
            const runner = new WDIORunner()
            global.browser = {}

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

            await runner.fetchDriverLogs()
            expect(fs.writeFile.mock.calls[0]).toEqual(['wdio-0-1-foo.log', '"#1 foo log"\n"#2 foo log"', 'utf-8'])
            expect(fs.writeFile.mock.calls[1]).toEqual(['wdio-0-1-bar.log', '"#1 bar log"\n"#2 bar log"', 'utf-8'])
            fs.writeFile.mockClear()
        })

        it('should not write to file if no logs exist', async () => {
            const runner = new WDIORunner()
            runner.cid = '0-1'

            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: () => Promise.resolve([])
            }

            await runner.fetchDriverLogs()
            expect(fs.writeFile.mock.calls).toHaveLength(0)
        })

        afterEach(() => {
            delete global.browser
        })
    })
})
