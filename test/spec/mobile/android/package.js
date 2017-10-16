import labels from '../../../fixtures/labels'

/**
 * Fauls due to:
 * "Error: That URL did not map to a valid JSONWP resource"
 */
describe.skip('package', () => {
    it('should get current package', async function () {
        (await this.client.getCurrentPackage()).should.be.equal(labels.PACKAGE)
    })
})
