import path from 'path'
import { remote } from '../../../src'

const toUpload = path.resolve(__dirname, '..', '..', '__mocks__', 'cat-to-upload.gif')

describe('uploadFile', () => {
		let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
    })
    it('uploads a file to the distant client', async function () {
        const uploadedFile = await browser.uploadFile(toUpload)
        expect(uploadedFile).not.to.be.undefined
        expect(uploadedFile).not.to.be.null;
        (/cat-to-upload\.gif$/).test(uploadedFile.value).should.be.true
    })
})
