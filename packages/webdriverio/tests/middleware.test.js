jest.mock('../src/commands/element/waitForExist', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}));
import waitForExist from '../src/commands/element/waitForExist';
import logger from '@wdio/logger'
import { remote } from '../src'
import request from 'request'

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

    it('should throw an error if the element is never found', async () => {
        waitForExist.mockImplementationOnce (( ) => { throw new Error(`Promise was rejected with the following reason`)});

        const elem = await browser.$('#foo')
        elem.elementId = undefined

        await expect(elem.click())
            .rejects.toThrow(`Can't call click on element with selector "#foo" because element wasn't found`)
    });

    it('should succesfully click on an element that falls stale after being refound', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo');
        subSubElem.elementId = undefined

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(warn.mock.calls).toHaveLength(1)
        expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        warn.mockClear();
        request.retryCnt = 0
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
