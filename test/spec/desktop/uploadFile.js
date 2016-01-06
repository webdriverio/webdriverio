import path from 'path'

const toUpload = path.join(__dirname, '..', '..', 'fixtures', 'cat-to-upload.gif')

describe('uploadFile', () => {
    it('uploads a file to the distant client', async function () {
        const uploadedFile = await this.client.uploadFile(toUpload)
        expect(uploadedFile).not.to.be.undefined
        expect(uploadedFile).not.to.be.null;
        (/cat\-to\-upload\.gif$/).test(uploadedFile.value).should.be.true
    })
})
