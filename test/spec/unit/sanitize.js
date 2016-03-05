import Sanitize from '../../../lib/helpers/sanitize'
import {deepEqual, AssertionError} from 'assert'

const MEDIUM_BASE64 = 'aGVsbG8gbXkgbmFtZSBpcyBnZW9yZ2UgYW5kIEkgcmVhbGx5IGxvdmUgd2ViZHJpdmVyaW8uIGhlbGxvIG15IG5hbWUgaXMgZ2VvcmdlIGFuZCBJIHJlYWxseSBsb3ZlIHdlYmRyaXZlcmlvLiBoZWxsbyBteSBuYW1lIGlzIGdlb3JnZSBhbmQgSSByZWFsbHkgbG92ZSB3ZWJkcml2ZXJpby4K'
const SHORT_BASE64 = 'Webdriverio4'
const MEDIUM_STRING = Array(201).join('$')
const LONG_STRING = Array(2001).join('$')

const SHORT_ARRAY = fillArray(3)
const LONG_ARRAY = fillArray(200)
const ARRAY_OF_LONG_STRINGS = fillArray(3, LONG_STRING)

const SHORT_OBJECT = fillObject(3)
const LONG_OBJECT = fillObject(20)
const OBJECT_OF_LONG_STRINGS = fillObject(3, LONG_STRING)

function fillArray (length, val) {
    return Array.apply(0, Array(length)).map((val, i) => val || i)
}

function fillObject (length, val) {
    const o = {}
    for (let i = 0; i < length; i++) {
        o[i] = val || i
    }
    return o
}

// Seems like non-strict equal doesn't exist in Chai BDD:
// https://github.com/chaijs/chai/issues/280
function compare (expected, actual) {
    return () => {
        deepEqual(expected, actual)
    }
}

describe('Sanitize', () => {
    it.skip('should sanitize capabilities')
    it.skip('should sanitize arguments')
    it.skip('should sanitize css')

    describe('Sanitize an arbitrary variable', () => {
        it('should return simple values unchanged', () => {
            expect(Sanitize.limit(undefined)).to.be.undefined
            expect(Sanitize.limit(null)).to.be.null
            expect(Sanitize.limit('')).to.be.equal('')
        })

        it('should highlight a base64 string', () => {
            const limited = Sanitize.limit(MEDIUM_BASE64)
            limited.should.be.equal('[base64] 220 bytes')
        })

        it('should not change a short base64-like string', () => {
            const limited = Sanitize.limit(SHORT_BASE64)
            limited.should.be.equal(SHORT_BASE64)
        })

        it('should not change a medium length non-base64 string', () => {
            const limited = Sanitize.limit(MEDIUM_STRING)
            limited.should.be.equal(MEDIUM_STRING)
        })

        it('should truncate a long non-base64 string', () => {
            const limited = Sanitize.limit(LONG_STRING)
            limited.should.be.equal(`${Array(201).join('$')} ... (1800 more bytes)`)
        })

        it('should not change a short simple array', () => {
            const limited = Sanitize.limit(SHORT_ARRAY)
            expect(compare(SHORT_ARRAY, limited)).to.not.throw(AssertionError)
        })

        it('should truncate a long simple array', () => {
            const limited = Sanitize.limit(LONG_ARRAY)

            const expected = fillArray(10)
            expected.push('(190 more items)')

            expect(compare(expected, limited)).to.not.throw(AssertionError)
        })

        it('should map array values to limit', () => {
            const limited = Sanitize.limit(ARRAY_OF_LONG_STRINGS)
            const expected = fillArray(3, `${Array(201).join('$')} ... (1800 more bytes)`)

            expect(compare(expected, limited)).to.not.throw(AssertionError)
        })

        it('should not change a short simple object', () => {
            const limited = Sanitize.limit(SHORT_OBJECT)
            expect(compare(SHORT_OBJECT, limited)).to.not.throw(AssertionError)
        })

        it('should truncate a long simple object and list keys', () => {
            const limited = Sanitize.limit(LONG_OBJECT)

            const expected = fillObject(10)
            expected._ = '10 more keys: ["10","11","12","13","14","15","16","17","18","19"]'

            expect(compare(expected, limited)).to.not.throw(AssertionError)
        })

        it('should map object values to limit', () => {
            const limited = Sanitize.limit(OBJECT_OF_LONG_STRINGS)
            const expected = fillObject(3, `${Array(201).join('$')} ... (1800 more bytes)`)

            expect(compare(expected, limited)).to.not.throw(AssertionError)
        })
    })
})
