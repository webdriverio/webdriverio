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
        await handler({ browserName: 'chrome' })
        const client = remote({})
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
        await handler({ browserName: 'foobar' })

        expect(remote).toHaveBeenCalledWith({
            browserName: 'foobar',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should set runner if @wdio/sync is installed', async () => {
        setSyncSupport(true)
        await handler({ browserName: 'foobar' })
        expect(remote).toHaveBeenCalledWith({
            browserName: 'foobar',
            runner: 'repl',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })
})
