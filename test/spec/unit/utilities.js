import { isSuccessfulResponse } from '../../../lib/helpers/utilities'

describe('utilities', () => {
    describe('isSuccessfulResponse', () => {
        it('should fail when there is no error', () => {
            expect(isSuccessfulResponse()).to.be.equal(false)
        })

        it('should fail when status is not 0', () => {
            expect(isSuccessfulResponse({
                status: 7,
                value: 'foobar'
            })).to.be.equal(false)
        })

        it('should fail when there is no value', () => {
            expect(isSuccessfulResponse({
                error: true
            })).to.be.equal(false)
        })

        it('should fail if value has an error', () => {
            expect(isSuccessfulResponse({
                value: {
                    error: 'foobar'
                }
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                value: {
                    stacktrace: 'foobar'
                }
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                value: {
                    stackTrace: 'foobar'
                }
            })).to.be.equal(false)
        })

        it('should pass otherwise', () => {
            expect(isSuccessfulResponse({
                value: null
            })).to.be.equal(false)

            expect(isSuccessfulResponse({
                value: false
            })).to.be.equal(true)
        })
    })
})
