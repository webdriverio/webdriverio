import labels from '../../../fixtures/labels'

describe('package', () => {
    it('should get current package', async function () {
        (await this.client.getCurrentPackage()).should.be.equal(labels.PACKAGE)
    })
})
