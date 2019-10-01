import { handler } from './../../src/commands/repl'
import { remote } from 'webdriverio'

describe('Command: repl', () => {
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
})
