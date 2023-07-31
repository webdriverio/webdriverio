import { describe, it, beforeAll, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
import logger from '@wdio/logger'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'

import { waitForExist } from '../src/commands/element/waitForExist.js'
import { remote } from '../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/commands/element/waitUntil', () => ({
    __esModule: true,
    waitUntil: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForDisplayed', () => ({
    __esModule: true,
    waitForDisplayed: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForExist', () => ({
    __esModule: true,
    waitForExist: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForEnabled', () => ({
    __esModule: true,
    waitForEnabled: vi.fn().mockImplementation(() => { return true })
}))

const { warn } = logger('foobar')

describe('middleware', () => {
    let browser: WebdriverIO.Browser

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
        vi.mocked(warn).mockClear()
        vi.mocked(waitForExist).mockClear()
    })

    it('should throw an error if the element is never found', async () => {
        vi.mocked(waitForExist).mockImplementationOnce(() => {
            throw new Error('Promise was rejected with the following reason')
        })

        const elem = await browser.$('#foo')
        elem.elementId = undefined as any

        await expect(elem.click())
            .rejects.toThrow('Can\'t call click on element with selector "#foo" because element wasn\'t found')
    })

    it('should successfully click on an element that falls stale after being re-found', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')
        subSubElem.elementId = undefined as any

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(vi.mocked(warn).mock.calls).toHaveLength(1)
        expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        // @ts-ignore mock feature
        got.retryCnt = 0
    })

    it('should successfully getAttribute of an element that falls stale after being re-found in Safari', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                // @ts-expect-error
                browserName: 'safari',
                // @ts-expect-error mock feature
                keepBrowserName: true
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
        const elem = await browser.$('#foo')
        elem.selector = '#nonexisting'
        // @ts-ignore mock feature
        got.setMockResponse([{ error: 'no such element', statusCode: 404 }, undefined, undefined, 'bar'])
        expect(await elem.getAttribute('foo')).toEqual('bar')
        expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        vi.mocked(got).mockClear()
    })

    it('should successfully click on a stale element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')

        //Success returns a null
        expect(await subSubElem.click()).toEqual(null)
        expect(vi.mocked(warn).mock.calls).toHaveLength(1)
        expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
    })

    it('should assign elementId and w3c identifier to element scope after re-found', async () => {
        const elem = await browser.$('#nonexisting')
        expect(elem.elementId).toEqual(undefined)
        expect(elem['element-6066-11e4-a52e-4f735466cecf']).toEqual(undefined)

        elem.selector = '#exists'
        elem.addCommand('getThis', function(this: any) { return this })
        // @ts-expect-error undefined custom command
        const elementThis = await elem.getThis()
        expect(elementThis.elementId).toEqual('some-elem-123')
        expect(elementThis['element-6066-11e4-a52e-4f735466cecf']).toEqual('some-elem-123')
    })

    describe('should NOT wait on element if', () => {
        // wdio default waitForExist command
        it('elem EXISTS and command = waitForExist', async () => {
            const elem = await browser.$('#exists')
            await elem.waitForExist()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
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
                expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
            })
        })

        it('elem EXISTS and command = foo', async () => {
            browser.addCommand('foo', () => {}, true)
            const elem = await browser.$('#exists')
            // @ts-expect-error undefined custom command
            await elem.foo()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
        })

        it('elem EXISTS and command = isExisting', async () => {
            const elem = await browser.$('#exists')
            await elem.isExisting()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
        })
    })

    describe('should wait on element if', () => {
        it('elem NOT_FOUND and command = foo', async () => {
            browser.addCommand('foo', () => {}, true)
            const elem = await browser.$('#nonexisting')
            // @ts-expect-error undefined custom command
            await elem.foo()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        })
    })
})
