import { isSuccessfulResponse, isValidParameter, getPrototype, commandCallStructure, isW3CSession } from '../src/utils'

import appiumResponse from './__fixtures__/appium.response.json'
import chromedriverResponse from './__fixtures__/chromedriver.response.json'
import geckodriverResponse from './__fixtures__/geckodriver.response.json'

describe('utils', () => {
    it('isSuccessfulResponse', () => {
        expect(isSuccessfulResponse()).toBe(false)
        expect(isSuccessfulResponse({})).toBe(false)
        expect(isSuccessfulResponse({
            body: undefined,
            statusCode: 200
        })).toBe(false)
        expect(isSuccessfulResponse({
            body: { value: { some: 'result' } },
            statusCode: 200
        })).toBe(true)
        expect(isSuccessfulResponse({
            body: { value: { error: new Error('foobar' )} },
            statusCode: 404
        })).toBe(false)
        expect(isSuccessfulResponse({
            body: { value: { error: 'no such element' } },
            statusCode: 404
        })).toBe(true)
        expect(isSuccessfulResponse({
            body: { status: 7 },
            statusCode: 200
        })).toBe(false)
        expect(isSuccessfulResponse({
            body: { status: 7, value: {} }
        })).toBe(false)
        expect(isSuccessfulResponse({
            body: { status: 0, value: {} }
        })).toBe(true)
        expect(isSuccessfulResponse({
            body: { status: 7, value: { message: 'no such element: foobar' } }
        })).toBe(true)
    })

    it('isValidParameter', () => {
        expect(isValidParameter(1, 'number')).toBe(true)
        expect(isValidParameter(1, 'number[]')).toBe(false)
        expect(isValidParameter([1], 'number[]')).toBe(true)
        expect(isValidParameter(1, '(number|string|object)')).toBe(true)
        expect(isValidParameter('1', '(number|string|object)')).toBe(true)
        expect(isValidParameter({}, '(number|string|object)')).toBe(true)
        expect(isValidParameter(false, '(number|string|object)')).toBe(false)
        expect(isValidParameter(1, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter('1', '(number|string|object)[]')).toBe(false)
        expect(isValidParameter({}, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(false, '(number|string|object)[]')).toBe(false)
        expect(isValidParameter([1], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter(['1'], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([{}], '(number|string|object)[]')).toBe(true)
        expect(isValidParameter([false], '(number|string|object)[]')).toBe(false)
        expect(isValidParameter(['1', false], '(number|string|object)[]')).toBe(false)
    })

    it('getPrototype', () => {
        const jsonWireProtocolPrototype = getPrototype()
        expect(jsonWireProtocolPrototype instanceof Object).toBe(true)
        expect(typeof jsonWireProtocolPrototype.sendKeys.value).toBe('function')

        const webdriverPrototype = getPrototype(true)
        expect(webdriverPrototype instanceof Object).toBe(true)
        expect(typeof webdriverPrototype.sendKeys).toBe('undefined')
        expect(typeof webdriverPrototype.performActions.value).toBe('function')
    })

    it('commandCallStructure', () => {
        expect(commandCallStructure('foobar', ['param', 1, true, { a: 123 }, () => true, null, undefined]))
            .toBe('foobar("param", 1, true, <object>, <fn>, null, undefined)')
    })

    it('isW3CSession', () => {
        expect(isW3CSession(appiumResponse.value)).toBe(false)
        expect(isW3CSession(chromedriverResponse.value)).toBe(false)
        expect(isW3CSession(geckodriverResponse.value)).toBe(true)
    })
})
