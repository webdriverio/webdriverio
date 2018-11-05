import {
    isSuccessfulResponse, isValidParameter, getPrototype, commandCallStructure, validateConfig
} from '../src/utils'

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

    describe('validateConfig', () => {
        it('should throw if required config is missing', () => {
            expect(() => validateConfig({
                foobar: {
                    type: 'string',
                    required: true
                }
            }, {})).toThrowError('Required option "foobar" is missing')
        })

        it('should not throw if required config is missing but default is defined', () => {
            expect(validateConfig({
                foobar: {
                    type: 'string',
                    required: true,
                    default: 'barfoo'
                }
            }, {})).toEqual({ foobar: 'barfoo' })
        })

        it('should check for types', () => {
            expect(() => validateConfig({
                foobar: {
                    type: 'string'
                }
            }, {
                foobar: 123
            })).toThrowError('Expected option "foobar" to be type of string but was number')
        })

        it('should check for types as function', () => {
            const errorCheck = (type) => {
                if (type instanceof Error) {
                    return
                }
                throw new Error('not an error')
            }

            expect(() => validateConfig({
                foobar: { type: errorCheck }
            }, {
                foobar: { message: 'foobar', stack: 'barfoo' }
            })).toThrowError(/Type check for option "foobar" failed: not an error/)

            expect(validateConfig({
                foobar: { type: errorCheck }
            }, {
                foobar: new Error('foobar')
            }).hasOwnProperty('foobar')).toBe(true)
        })

        it('should match something', () => {
            expect(() => validateConfig({
                logLevel: {
                    type: 'string',
                    default: 'trace',
                    match: /(trace|debug|info|warn|error)/
                }
            }, {
                logLevel: 'dontknow'
            })).toThrowError(/doesn't match expected values/)

            expect(validateConfig({
                logLevel: {
                    type: 'string',
                    default: 'trace',
                    match: /(trace|debug|info|warn|error)/
                }
            }, {
                logLevel: 'info'
            }).hasOwnProperty('logLevel')).toBe(true)
        })
    })
})
