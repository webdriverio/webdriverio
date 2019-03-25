import getStrictSsl from '../src/getStrictSsl'

describe('getStrictSsl', () => {
    beforeEach(function() {
        delete process.env.STRICT_SSL
        delete process.env.strict_ssl
    })

    it('should return "false" when environment variable "STRICT_SSL" is defined with value "false"', () => {
        process.env['STRICT_SSL'] = 'false'
        expect(getStrictSsl()).toEqual(false)
    })

    it('should return "false" when environment variable "strict_ssl" is defined with value "false"', () => {
        process.env['strict_ssl'] = 'false'
        expect(getStrictSsl()).toEqual(false)
    })

    it('should return "true" when environment variable "STRICT_SSL" is defined with value "true"', () => {
        process.env['STRICT_SSL'] = 'true'
        expect(getStrictSsl()).toEqual(true)
    })

    it('should return "true" when environment variable "strict_ssl" is defined with value "true"', () => {
        process.env['strict_ssl'] = 'true'
        expect(getStrictSsl()).toEqual(true)
    })

    it('should return "true" when environment variable "STRICT_SSL" / "strict_ssl" is not defined', () => {
        expect(getStrictSsl()).toEqual(true)
    })

    it('should return "true" when environment variable "STRICT_SSL" is defined with any other value than "false"', () => {
        process.env['STRICT_SSL'] = 'foo'
        expect(getStrictSsl()).toEqual(true)
    })

    it('should return "true" when environment variable "strict_ssl" is defined with any other value than "false"', () => {
        process.env['strict_ssl'] = 'foo'
        expect(getStrictSsl()).toEqual(true)
    })
})
