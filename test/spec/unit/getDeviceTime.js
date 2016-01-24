describe('getDeviceTime', () => {
    before(global.setupInstance)

    it('should return the device time', async function () {
        mock('get', '/session/123ABC/appium/device/system_time', {
            status: 0,
            sessionId: '123ABC',
            value: 'foo'
        })
        expect((await this.client.getDeviceTime()).value).to.be.equal('foo')
    })
})
