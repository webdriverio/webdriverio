import fs from 'fs'
import path from 'path'

const screenshotPath = path.join(__dirname, '..', '..', '..', 'test.png')

describe('saveScreenshot', () => {
    it('should take a screenshot and output it on a desired location', async function () {
        await this.client.saveScreenshot(screenshotPath)
        fs.existsSync(screenshotPath).should.be.true
    })

    it('should take a screenshot and return it as a PNG image in Buffer', async function () {
        (await this.client.saveScreenshot()).toString('hex', 0, 4).should.be.equal('89504e47')
    })
})
