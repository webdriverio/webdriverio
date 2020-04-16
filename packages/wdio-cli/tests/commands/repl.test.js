import yargs from 'yargs'
import { remote } from 'webdriverio'
import { setSyncSupport } from '@wdio/utils'

import { handler, builder } from './../../src/commands/repl'

jest.mock('@wdio/utils', () => {
    let syncSupport = false

    return {
        setSyncSupport: (val) => (syncSupport = val),
        get hasWdioSyncSupport () {
            return syncSupport
        }
    }
})

jest.mock('repl')

describe('repl commandDir', () => {
    it('should call debug command', async () => {
        const client = await handler({ browserName: 'chrome' })
        expect(client.debug).toHaveBeenCalledTimes(1)
        expect(client.deleteSession).toHaveBeenCalledTimes(1)
    })

    it('it should properly build command', () => {
        builder(yargs)
        expect(yargs.options).toHaveBeenCalled()
        expect(yargs.example).toHaveBeenCalled()
        expect(yargs.epilogue).toHaveBeenCalled()
        expect(yargs.help).toHaveBeenCalled()
    })

    afterEach(() => {
        delete global.$
        delete global.$$
        delete global.browser
    })
})

describe('Command: repl', () => {
    beforeEach(() => {
        remote.mockClear()
    })

    it('should attach global variables', async () => {
        await handler({})

        expect(global.$).not.toBeUndefined()
        expect(global.$$).not.toBeUndefined()
        expect(global.browser).not.toBeUndefined()
    })

    it('should set the correct browser', async () => {
        await handler({ option: 'foobar' })

        expect(remote).toHaveBeenCalledWith({ capabilities: { browserName: 'foobar' }, option: 'foobar' })
    })

    it('should set runner if @wdio/sync is installed', async () => {
        setSyncSupport(true)
        await handler({ option: 'foobar' })
        expect(remote).toHaveBeenCalledWith({
            runner: 'repl',
            option: 'foobar',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        delete global.$
        delete global.$$
        delete global.browser
    })
})
