import { remote } from 'webdriverio'

import { handler } from '../src/commands/repl'

jest.mock('repl')

describe('repl commandDir', () => {
    it('should call debug command', async () => {
        await handler({ browserName: 'chrome' })
        const client = remote({})
        expect(client.debug).toHaveBeenCalledTimes(1)
        expect(client.deleteSession).toHaveBeenCalledTimes(1)
    })
})
