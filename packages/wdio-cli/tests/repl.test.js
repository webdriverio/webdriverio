import { handler } from '../src/commands/repl'

jest.mock('repl')

import repl from 'repl'
import request from 'request'

describe('repl commandDir', () => {
    it('should call debug command', async () => {
        await handler({ browserName: 'chrome' })
        expect(repl.start.mock.calls).toHaveLength(1)
        expect(request.mock.calls).toHaveLength(2)
    })
})
