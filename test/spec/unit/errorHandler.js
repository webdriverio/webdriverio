import { ErrorHandler } from '../../../index'
import { CommandError, RuntimeError } from '../../../lib/utils/ErrorHandler'

describe('ErrorHandler', () => {
    it('should accessible through module object', () => {
        expect(ErrorHandler).not.to.be.undefined
        expect(ErrorHandler).not.to.be.null
    })

    it('should throw selenium error when passing specific error ID', () => {
        const error = new CommandError(17)
        error.name.should.be.equal('Error')
        error.message.should.be.equal('An error occurred while executing user supplied JavaScript.')
    })

    it('should report command error', () => {
        const error = new CommandError('Some error in command', 'extra info')
        error.name.should.be.equal('Error')
        error.message.should.be.equal('Some error in command')
        error.details.should.be.equal('extra info')
    })

    it('should report runtime error', () => {
        const error = new RuntimeError('Some error in runtime')
        error.name.should.be.equal('Error')
        error.message.should.be.equal('Some error in runtime')
    })

    it('should capture stacktrace after message modifying', () => {
        const error = new RuntimeError(1)

        error.stack.should.match(/An unknown server-side error occurred while processing the command/)
    })
})
