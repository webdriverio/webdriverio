import path from 'path'

const toUpload = path.join(__dirname, '..', '..', 'fixtures', 'cat-to-upload.gif')

describe('chooseFile: choosing a file in an <input type=file>', () => {
    it('uploads a file and fills the form with it', async function () {
        await this.client.chooseFile('#upload-test', toUpload)
        const val = await this.client.getValue('#upload-test')
        expect(/cat\-to\-upload\.gif$/.test(val)).to.be.equal(true)
    })

    it('errors if file does not exists', function () {
        return this.client.chooseFile('#upload-test', '$#$#940358435').catch((err) => {
            expect(err).not.to.be.undefined
            expect(err).not.to.be.null
        })
    })
})
