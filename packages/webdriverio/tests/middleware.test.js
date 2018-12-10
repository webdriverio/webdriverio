import logger from '@wdio/logger'
import { remote } from '../src'

const { warn  } = logger()

describe('middleware', () => {
    let browser;

    beforeAll( async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
    })

    it('should succesfully click on a stale element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo');

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(warn.mock.calls).toHaveLength(1)
        expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])
    })
    
})
