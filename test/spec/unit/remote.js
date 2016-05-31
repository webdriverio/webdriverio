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

    it('should default to firefox if caps are empty', () => {
        var client = remote({ desiredCapabilities: { } })
        client.desiredCapabilities.browserName.should.be.equal('firefox')
    })

    // This allows testing a native Android app via appium using an
    // already-installed app rather than uploading and installing from an apk.
    it('should not force firefox when app is undefined but appPackage is not', () => {
        var client = remote({ desiredCapabilities: {browserName: '', appPackage: 'com.example' } })
        client.desiredCapabilities.browserName.should.be.equal('')
    })

})
