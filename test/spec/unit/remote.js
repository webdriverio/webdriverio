import { remote } from '../../../index.js'

const sessionID = 'ba8ca350-e0e3-4a73-aab5-1679559cdcd2'
const startPath = '/abc/xyz'

describe('remote method', () => {
    it('does not fail without options', () => {
        expect(() => {
            remote()
        }).not.to.throw
    })

    it('attaches client to existing session', () => {
        var client = remote(sessionID)
        client.requestHandler.sessionID.should.be.equal(sessionID)
    })

    it('should be able to set startPath', () => {
        var client = remote({ path: startPath })
        client.requestHandler.startPath.should.be.equal(startPath)
    })

    it('should not force firefox if browserName cap is an empty string', () => {
        var client = remote({ desiredCapabilities: { browserName: '', app: 'xyz' } })
        client.desiredCapabilities.browserName.should.be.equal('')
    })
})
