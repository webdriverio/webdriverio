import { isSuccessfulResponse, isUnknownCommand, isUnknownError, formatHostname } from '../../../lib/helpers/utilities'

describe('utilities', () => {
    describe('isSuccessfulResponse', () => {
        it('should fail when there is no error', () => {
            expect(isSuccessfulResponse()).to.be.equal(false)
        })

        it('should pass if code is 200, status is 0 and value is defined', () => {
            expect(isSuccessfulResponse({
                body: {
                    status: 0,
                    value: {}
                },
                statusCode: 200
            })).to.be.equal(true)
        })

        it('should fail when status is not 0', () => {
            expect(isSuccessfulResponse({
                body: {
                    status: 7,
                    value: 'foobar'
                }
            })).to.be.equal(false)
        })

        it('should fail when there is no value', () => {
            expect(isSuccessfulResponse({
                body: {
                    error: true
                },
                statusCode: 200
            })).to.be.equal(false)
        })

        it('should fail if value has an error and code is not 200', () => {
            expect(isSuccessfulResponse({
                body: {
                    value: {
                        error: 'foobar'
                    }
                },
                statusCode: 203
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                body: {
                    value: {
                        stacktrace: 'foobar'
                    }
                },
                statusCode: 203
            })).to.be.equal(false)
        })

        it('should pass otherwise', () => {
            expect(isSuccessfulResponse({
                body: {
                    value: null
                }
            })).to.be.equal(true)

            expect(isSuccessfulResponse({
                body: {
                    value: false
                }
            })).to.be.equal(true)
        })
    })

    describe('isUnknownCommand', () => {
        it('no valid error', () => {
            expect(isUnknownCommand()).to.be.equal(false)
            expect(isUnknownCommand('foobar')).to.be.equal(false)
        })

        it('should recognise unknown command when using driver', () => {
            expect(isUnknownCommand({
                message: 'unknown command'
            })).to.be.equal(true)

            expect(isUnknownCommand({
                message: 'Method has not yet been implemented'
            })).to.be.equal(true)

            expect(isUnknownCommand({
                message: 'POST /session/foobar/keys did not match a known command'
            })).to.be.equal(true)

            expect(isUnknownCommand({
                message: 'Command not found: ...'
            })).to.be.equal(true)
        })

        it('should recognise unknown command when using selenium standalone', () => {
            expect(isUnknownCommand({
                message: 'foobar',
                seleniumStack: {
                    type: 'UnknownCommand'
                }
            })).to.be.equal(true)

            expect(isUnknownCommand({
                message: 'foobar',
                seleniumStack: {
                    type: 'Unknown'
                }
            })).to.be.equal(true)
        })

        it('should recognise unknown command when using chromedriver', () => {
            expect(isUnknownCommand({
                message: 'did not map to a valid resource'
            })).to.be.equal(true)
        })

        it('should recognise unknown server-side error response', () => {
            expect(isUnknownCommand({
                message: 'java.io.IOException: Server returned HTTP response code: 405 for URL:',
                seleniumStack: {
                    type: 'UnknownError',
                    message: 'An unknown server-side error occurred while processing the command.'
                }
            })).to.be.equal(true)
        })
    })

    describe('isUnknownError', () => {
        it('no valid error', () => {
            expect(isUnknownError()).to.be.equal(false)
            expect(isUnknownError('foobar')).to.be.equal(false)
        })

        it('should recognise unknown command when using driver', () => {
            expect(isUnknownError({
                message: 'Unknown error'
            })).to.be.equal(true)
        })

        it('should recognise unknown command as case insensitive when using driver', () => {
            expect(isUnknownError({
                message: 'unknown error'
            })).to.be.equal(true)

            expect(isUnknownError({
                message: 'UNKNOWN ERROR'
            })).to.be.equal(true)
        })
    })

    describe('formatHostname', () => {
        it('should properly format hostname', () => {
            formatHostname('::1').should.equal('[::1]')
            formatHostname('127.0.0.1').should.equal('127.0.0.1')
            formatHostname('localhost').should.equal('localhost')
        })
    })
})
