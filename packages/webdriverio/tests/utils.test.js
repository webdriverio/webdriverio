import path from 'path'
import { ELEMENT_KEY } from '../src/constants'
import {
    transformToCharString,
    parseCSS,
    checkUnicode,
    verifyArgsAndStripIfElement,
    getAbsoluteFilepath,
    assertDirectoryExists,
    validateUrl
} from '../src/utils'

describe('utils', () => {

    describe('transformToCharString', () => {
        it('should allow to pass non arrays to it', () => {
            expect(transformToCharString('foobar')).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
        })

        it('should do nothing if all is good', () => {
            expect(transformToCharString(['f'])).toEqual(['f'])
        })

        it('should be able to transform objects', () => {
            expect(transformToCharString({ a: 1 })).toEqual(['{', '"', 'a', '"', ':', '1', '}'])
        })

        it('should be able to transform numbers', () => {
            expect(transformToCharString(42)).toEqual(['4', '2'])
        })

        it('should be able to transform booleans', () => {
            expect(transformToCharString(true)).toEqual(['t', 'r', 'u', 'e'])
        })

        it('ignore undefined/null', () => {
            expect(transformToCharString([null])).toEqual([])
            expect(transformToCharString([undefined])).toEqual([])
        })

        it('can do all of this together', () => {
            expect(transformToCharString(['foo', undefined, { b: 1 }, null, 42, false])).toEqual(
                ['f', 'o', 'o', '{', '"', 'b', '"', ':', '1', '}', '4', '2', 'f', 'a', 'l', 's', 'e'])
        })

        it('should convert string to unicode', () => {
            expect(transformToCharString('Enter')).toEqual(['\uE007'])
            expect(transformToCharString('Back space')).toEqual(['\uE003'])
            expect(transformToCharString('Backspace')).toEqual(['\uE003'])
            expect(transformToCharString('Pageup')).toEqual(['\uE00E'])
        })
    })

    describe('parseCSS', () => {
        it('should return null if css prop is null', () => {
            expect(parseCSS()).toBe(null)
        })

        it('should parse colors properly', () => {
            expect(parseCSS('rgba(0, 136, 204, 1)', 'color')).toEqual({
                property: 'color',
                value: 'rgba(0,136,204,1)',
                parsed: {
                    hex: '#0088cc',
                    alpha: 1,
                    type: 'color',
                    rgba: 'rgba(0,136,204,1)'
                }
            })

            expect(parseCSS('#0088cc', 'color')).toEqual({
                property: 'color',
                value: '#0088cc'
            })
        })

        it('should parse fonts properly', () => {
            expect(parseCSS('helvetica', 'font-family')).toEqual({
                property: 'font-family',
                value: 'helvetica',
                parsed: {
                    value: ['helvetica'],
                    type: 'font',
                    string: 'helvetica'
                }
            })
        })

        it('should parse number with unit values', () => {
            expect(parseCSS('100px', 'width')).toEqual({
                property: 'width',
                value: '100px',
                parsed: {
                    type: 'number',
                    string: '100px',
                    unit: 'px',
                    value: 100
                }
            })

            expect(parseCSS('50%', 'width')).toEqual({
                property: 'width',
                value: '50%',
                parsed: {
                    type: 'number',
                    string: '50%',
                    unit: '%',
                    value: 50
                }
            })

            expect(parseCSS('42', 'foobar')).toEqual({
                property: 'foobar',
                value: 42,
                parsed: {
                    type: 'number',
                    string: '42',
                    unit: '',
                    value: 42
                }
            })
        })
    })

    describe('checkUnicode', () => {
        it('should return array with unicode', () => {
            const result = checkUnicode('Home')

            expect(Array.isArray(result)).toBe(true)
            expect(result[0]).toEqual('\uE011')
        })

        it('should return an array without unicode', () => {
            const result = checkUnicode('foo')

            expect(Array.isArray(result)).toBe(true)
            expect(result[0]).toBe('f')
            expect(result[1]).toBe('o')
            expect(result[2]).toBe('o')
        })
    })

    describe('verifyArgsAndStripIfElement', () => {
        class Element {
            constructor({ elementId, ...otherProps }) {
                this.elementId = elementId
                Object.keys(otherProps).forEach(key => this[key] = otherProps[key])
            }
        }

        it('returns the same value if it is not an element object', () => {
            expect(verifyArgsAndStripIfElement([1, 'two', true, false, null, undefined])).toEqual([1, 'two', true, false, null, undefined])
        })

        it('strips down properties if value is element object', () => {
            const fakeObj = new Element({
                elementId: 'foo-bar',
                someProp: 123,
                anotherProp: 'abc'
            })

            expect(verifyArgsAndStripIfElement([fakeObj, 'abc', 123])).toMatchObject([
                { [ELEMENT_KEY]: 'foo-bar', ELEMENT: 'foo-bar' },
                'abc',
                123
            ])
        })

        it('should work even if parameter is not of type Array', () => {
            const fakeObj = new Element({
                elementId: 'foo-bar',
                someProp: 123,
                anotherProp: 'abc'
            })

            expect(verifyArgsAndStripIfElement(fakeObj)).toMatchObject(
                { [ELEMENT_KEY]: 'foo-bar', ELEMENT: 'foo-bar' }
            )
            expect(verifyArgsAndStripIfElement('foo')).toEqual('foo')
        })

        it('throws error if element object is missing element id', () => {
            const fakeObj = new Element({
                someProp: 123,
                anotherProp: 'abc',
                selector: 'div'
            })

            expect(() => verifyArgsAndStripIfElement(fakeObj)).toThrow('The element with selector "div" you trying to pass into the execute method wasn\'t found')
        })
    })

    describe('getAbsoluteFilepath', () => {
        it('should not change filepath if starts with forward slash', () => {
            const filepath = '/packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with backslash slash', () => {
            const filepath = '\\packages\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with windows drive letter', async () => {
            const filepath = 'E:\\foo\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should change filepath if does not start with forward or back slash', async () => {
            const filepath = 'packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(path.join(process.cwd(), 'packages/bar.png'))
        })
    })

    describe('assertDirectoryExists', () => {
        it('should fail if not existing directory', () => {
            expect(() => assertDirectoryExists('/i/dont/exist.png')).toThrowError(new Error('directory (/i/dont) doesn\'t exist'))
        })
        it('should not fail if directory exists', () => {
            expect(() => assertDirectoryExists('.')).not.toThrow()
        })
    })

    describe('validateUrl', () => {
        it('should ensure url is correct', () => {
            expect(validateUrl('http://json.org')).toEqual('http://json.org/')
            expect(validateUrl('www.json.org')).toEqual('http://www.json.org/')
            expect(validateUrl('json.org')).toEqual('http://json.org/')
            expect(validateUrl('about:blank')).toEqual('about:blank')
            expect(validateUrl('IamInAHost')).toEqual('http://iaminahost/')
            expect(validateUrl('data:text/html, <html contenteditable>'))
                .toEqual('data:text/html, <html contenteditable>')
            expect(() => validateUrl('_I.am.I:nvalid'))
                .toThrowError('Invalid URL: _I.am.I:nvalid')
        })
    })
})
