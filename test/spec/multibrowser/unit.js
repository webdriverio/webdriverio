import getImplementedCommands from '../../../lib/helpers/getImplementedCommands'

const IMPLEMENTED_COMMANDS = getImplementedCommands()

describe('Browsermatrix', () => {
    it('should provide all WebdriverIO commands', function () {
        for (let fnName of Object.keys(IMPLEMENTED_COMMANDS)) {
            this.client[fnName].should.be.a('function')
            this.browserA[fnName].should.be.a('function')
            this.browserB[fnName].should.be.a('function')
        }
    })

    it('should provide a method to select certain instances by name', function () {
        this.client.select('browserA').should.be.eql(this.browserA)
        this.client.select('browserB').should.be.eql(this.browserB)
    })
})
