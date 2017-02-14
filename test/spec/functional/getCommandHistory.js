const sinon = require('sinon')

describe('getCommandHistory', () => {
    it('text should be visible after clicking on .btn1', async function () {
        const clock = sinon.useFakeTimers()

        await this.client.getTitle().then(() => clock.tick(100))
        await this.client.click('body')

        const commandList = (await this.client.getCommandHistory()).slice(-5)
        commandList[0].name.should.be.equal('getTitle')
        commandList[0].args.should.have.length(0)
        commandList[0].timestamp.should.be.equal(0)
        commandList[1].name.should.be.equal('title')
        commandList[1].args.should.have.length(0)
        commandList[1].timestamp.should.be.equal(0)
        commandList[2].name.should.be.equal('click')
        commandList[2].args[0].should.be.equal('body')
        commandList[3].name.should.be.equal('element')
        commandList[3].args[0].should.be.equal('body')
        commandList[3].timestamp.should.be.equal(100)
        commandList[4].name.should.be.equal('elementIdClick')
        commandList[4].timestamp.should.be.equal(100)

        clock.restore()
    })
})
