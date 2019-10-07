import { remote } from 'webdriverio'
import { setSyncSupport } from '@wdio/utils'

import { handler } from './../../src/commands/repl'

jest.mock('@wdio/utils', () => {
    let syncSupport = false

    return {
        setSyncSupport: (val) => (syncSupport = val),
        get hasWdioSyncSupport () {
            return syncSupport
        }
    }
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
