import { remote } from '../../../index.js'
import RequestHandler from '../../../lib/utils/RequestHandler'
import q from 'q'

describe('moveTo command', () => {
    const sandbox = sinon.sandbox.create()

    afterEach(() => sandbox.restore())

    it('should not set any offset by default', () => {
        sandbox.stub(RequestHandler.prototype, 'create').returns(q())
        const client = remote({})

        return client.moveTo('some-element')
            .then(() => {
                assert.calledWith(RequestHandler.prototype.create, '/session/:sessionId/moveto', {element: 'some-element'})
            })
    })
})
