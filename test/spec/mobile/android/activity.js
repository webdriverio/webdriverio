import labels from '../../../fixtures/labels'

describe('activity', () => {
    it('should get current activity', async function () {
        (await this.client.getCurrentDeviceActivity()).should.be.equal(labels.ACTIVITY)
    })
})
