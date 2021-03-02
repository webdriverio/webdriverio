import yargs from 'yargs'
import { remote } from 'webdriverio'
// @ts-ignore mock feature
import { setSyncSupport } from '@wdio/utils'

import { handler, builder } from '../../src/commands/repl'

jest.mock('@wdio/utils', () => {
    let syncSupport = false

    return {
        setSyncSupport: (val: boolean) => (syncSupport = val),
        get hasWdioSyncSupport () {
            return syncSupport
        }
    }
})

jest.mock('repl')

describe('repl commandDir', () => {
    it('should call debug command', async () => {
        const client = await handler({ browserName: 'chrome' } as any) as any
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
        // @ts-ignore mock feature
        delete global.$
        // @ts-ignore mock feature
        delete global.$$
        // @ts-ignore mock feature
        delete global.browser
    })
})

describe('Command: repl', () => {
    beforeEach(() => {
        (remote as jest.Mock).mockClear()
    })

    it('should attach global variables', async () => {
        await handler({} as any)

        expect(global.$).not.toBeUndefined()
        expect(global.$$).not.toBeUndefined()
        expect(global.browser).not.toBeUndefined()
    })

    it('should set the correct browser', async () => {
        await handler({ option: 'foobar' } as any)

        expect(remote).toHaveBeenCalledWith({ capabilities: { browserName: 'foobar' }, option: 'foobar' } as any)
    })

    it('should set runner if @wdio/sync is installed', async () => {
        setSyncSupport(true)
        await handler({ option: 'foobar' } as any)
        expect(remote).toHaveBeenCalledWith({
            runner: 'local',
            // @ts-expect-error
            option: 'foobar',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        // @ts-ignore mock feature
        delete global.$
        // @ts-ignore mock feature
        delete global.$$
        // @ts-ignore mock feature
        delete global.browser
    })
})
