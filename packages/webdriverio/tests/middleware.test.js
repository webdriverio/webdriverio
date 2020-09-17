import logger from '@wdio/logger'
import { remote } from '../src'
import got from 'got'

jest.mock('../src/commands/element/waitUntil', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}))
jest.mock('../src/commands/element/waitForDisplayed', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}))
jest.mock('../src/commands/element/waitForExist', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}))
jest.mock('../src/commands/element/waitForEnabled', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}))

const waitForExist = require('../src/commands/element/waitForExist')

const { warn } = logger()

describe('middleware', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
    })

    afterEach(() => {
        warn.mockClear()
        waitForExist.default.mockClear()
    })

    it('should throw an error if the element is never found', async () => {
        waitForExist.default.mockImplementationOnce(() => {
            throw new Error('Promise was rejected with the following reason')
        })

        const elem = await browser.$('#foo')
        elem.elementId = undefined

        await expect(elem.click())
            .rejects.toThrow('Can\'t call click on element with selector "#foo" because element wasn\'t found')
    })

    it('should successfully click on an element that falls stale after being re-found', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')
        subSubElem.elementId = undefined

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(warn.mock.calls).toHaveLength(1)
        expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        got.retryCnt = 0
    })

    it('should successfully getAttribute of an element that falls stale after being re-found in Safari', async () => {
        const elem = await browser.$('#foo')
        elem.selector = '#nonexisting'
        got.setMockResponse([{ error: 'no such element', statusCode: 404 }, undefined, undefined, 'bar'])
        expect(await elem.getAttribute('foo')).toEqual('bar')
        expect(waitForExist.default.mock.calls).toHaveLength(1)
        got.mockClear()
    })

    it('should successfully click on a stale element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(warn.mock.calls).toHaveLength(1)
        expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])
    })

    it('should assign elementId and w3c identifier to element scope after re-found', async () => {
        const elem = await browser.$('#nonexisting')
        expect(elem.elementId).toEqual(undefined)
        expect(elem['element-6066-11e4-a52e-4f735466cecf']).toEqual(undefined)

        elem.selector = '#exists'
        elem.addCommand('getThis', function() {return this})
        const elementThis = await elem.getThis()
        expect(elementThis.elementId).toEqual('some-elem-123')
        expect(elementThis['element-6066-11e4-a52e-4f735466cecf']).toEqual('some-elem-123')
    })

    describe('should NOT wait on element if', () => {
        // wdio default waitForExist command
        it('elem EXISTS and command = waitForExist', async () => {
            const elem = await browser.$('#exists')
            await elem.waitForExist()
            expect(waitForExist.default.mock.calls).toHaveLength(1)
        })

        const commands = [
            // wdio default commands
            'waitUntil',
            'waitForDisplayed',
            'waitForEnabled',
            'isElementDisplayed',
            'isDisplayed',
            'isExisting',

            // custom commands
            'waitUntilFoo',
            'waitForFoo',
            'isExistingFoo',
            'isDisplayedFoo']

        commands.forEach(commandName => {
            it(`elem NOT_FOUND and command = ${commandName}`, async () => {
                browser.addCommand(commandName, () => {}, true)
                const elem = await browser.$('#nonexisting')
                await elem[commandName]()
                expect(waitForExist.default.mock.calls).toHaveLength(0)
            })
        })

        it('elem EXISTS and command = foo', async () => {
            browser.addCommand('foo', () => {}, true)
            const elem = await browser.$('#exists')
            await elem.foo()
            expect(waitForExist.default.mock.calls).toHaveLength(0)
        })

        it('elem EXISTS and command = isExisting', async () => {
            const elem = await browser.$('#exists')
            await elem.isExisting()
            expect(waitForExist.default.mock.calls).toHaveLength(0)
        })
    })

    describe('should wait on element if', () => {
        it('elem NOT_FOUND and command = foo', async () => {
            browser.addCommand('foo', () => {}, true)
            const elem = await browser.$('#nonexisting')
            await elem.foo()
            expect(waitForExist.default.mock.calls).toHaveLength(1)
        })
    })
})
