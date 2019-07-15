import { overwriteElementCommands, commandCallStructure, isFunctionAsync } from '../src/utils'

describe('utils', () => {
    it('commandCallStructure', () => {
        expect(commandCallStructure('foobar', ['param', 1, true, { a: 123 }, () => true, null, undefined]))
            .toBe('foobar("param", 1, true, <object>, <fn>, null, undefined)')
    })

    describe('overwriteElementCommands', () => {
        it('should overwrite command', function () {
            const context = {}
            const propertiesObject = {
                foo: { value() { return 1 } },
                __elementOverrides__: {
                    value: { foo(origCmd, arg) { return [origCmd(), arg] } }
                }
            }
            overwriteElementCommands.call(context, propertiesObject)
            expect(propertiesObject.foo.value(5)).toEqual([1, 5])
        })

        it('should create __elementOverrides__ if not exists', function () {
            const propertiesObject = {}
            overwriteElementCommands.call(null, propertiesObject)
            expect(propertiesObject.__elementOverrides__).toBeTruthy()
        })

        it('should throw if user command is not a function', function () {
            const propertiesObject = { __elementOverrides__: { value: {
                foo: 'bar'
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: commands be overwritten only with functions, command: foo')
        })

        it('should throw if there is no command to be propertiesObject', function () {
            const propertiesObject = { __elementOverrides__: { value: {
                foo: jest.fn()
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: no command to be overwritten: foo')
        })

        it('should throw on attempt to overwrite not a function', function () {
            const propertiesObject = { foo: 'bar', __elementOverrides__: { value: {
                foo: jest.fn()
            } } }
            expect(() => overwriteElementCommands.call(null, propertiesObject))
                .toThrow('overwriteCommand: only functions can be overwritten, command: foo')
        })
    })

    describe('isFunctionAsync', () => {
        it('should return true if function is async', () => {
            expect(isFunctionAsync(async () => {})).toBe(true)
        })

        it('should return true if function name is async', () => {
            expect(isFunctionAsync(function async () {})).toBe(true)
        })

        it('should return false if function is not async', () => {
            expect(isFunctionAsync(() => {})).toBe(false)
        })

        it('should return false if some special object is passed instead of function', () => {
            expect(isFunctionAsync({})).toBe(false)
        })
    })
})
