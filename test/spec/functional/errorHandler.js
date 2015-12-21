import { ErrorHandler } from '../../../index'

describe('ErrorHandler', () => {
    it('should accessible through module object', () => {
        expect(ErrorHandler).not.to.be.undefined
        expect(ErrorHandler).not.to.be.null
    })

    it('should throw selenium error when passing specific error ID', () => {
        const error = new ErrorHandler(17)
        error.name.should.be.equal('Error')
    })
})
