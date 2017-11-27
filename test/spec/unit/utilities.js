import { isSuccessfulResponse, isUnknownCommand } from '../../../lib/helpers/utilities'

describe('utilities', () => {
    describe('isSuccessfulResponse', () => {
        it('should fail when there is no error', () => {
            expect(isSuccessfulResponse()).to.be.equal(false)
        })

        it('should pass if status code is 200', () => {
            expect(isSuccessfulResponse({ statusCode: 200 })).to.be.equal(true)
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
                }
            })).to.be.equal(false)
        })

        it('should fail if value has an error', () => {
            expect(isSuccessfulResponse({
                body: {
                    value: {
                        error: 'foobar'
                    }
                }
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                body: {
                    value: {
                        stacktrace: 'foobar'
                    }
                }
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                body: {
                    value: {
                        stackTrace: 'foobar'
                    }
                }
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
                message: 'POST /session/foobar/keys did not match a known command'
            })).to.be.equal(true)
        })

        it('should recognise unknown command when using selenium standalone', () => {
            expect(isUnknownCommand({
                message: 'foobar',
                seleniumStack: {
                    type: 'UnknownCommand'
                }
            })).to.be.equal(true)
        })
    })
})
