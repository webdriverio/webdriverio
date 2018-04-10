import { remote } from '../../../src'

jest.mock('repl')

import repl from 'repl'

describe('debug command', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should initialise repl', () => {
        browser.debug()
        expect(repl.start.mock.calls).toHaveLength(1)
    })
})
