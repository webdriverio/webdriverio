import { describe, it, expect } from 'vitest'
import { validateConfig } from '../src/utils'

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
        const errorCheck = (type: any) => {
            if (type instanceof Error) {
                return
            }
            throw new Error('not an error')
        }

        expect(() => validateConfig({
            foobar: { type: 'object', validate: errorCheck }
        }, {
            foobar: { message: 'foobar', stack: 'barfoo' }
        })).toThrowError(/Type check for option "foobar" failed: not an error/)

        expect(Object.prototype.hasOwnProperty.call(validateConfig({
            foobar: { type: 'object', validate: errorCheck }
        }, {
            foobar: new Error('foobar')
        }), 'foobar')).toBe(true)
    })

    it('should match something', () => {
        expect(() => validateConfig({
            logLevel: {
                type: 'string',
                default: 'trace',
                match: /(trace|debug|info|warn|error|silent)/
            }
        }, {
            logLevel: 'dontknow'
        })).toThrowError(/doesn't match expected values/)

        expect(Object.prototype.hasOwnProperty.call(validateConfig({
            logLevel: {
                type: 'string',
                default: 'trace',
                match: /(trace|debug|info|warn|error|silent)/
            }
        }, {
            logLevel: 'info'
        }), 'logLevel')).toBe(true)
    })

    it('should keep certain keys if desired', () => {
        // @ts-expect-error
        expect(validateConfig({
            logLevel: {
                type: 'string',
                default: 'trace',
                match: /(trace|debug|info|warn|error|silent)/
            }
        }, {
            logLevel: 'info',
            foo: 'bar',
            bar: 'foo'
        }, ['foo'])).toEqual({
            logLevel: 'info',
            foo: 'bar'
        })
    })
})
