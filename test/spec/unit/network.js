/**
 * testing this as unit test because of buggy android behavior
 * @see https://github.com/appium/appium/issues/3581
 * @see https://discuss.appium.io/t/adb-loses-device-connection-after-setnetworkconnection-api-is-used/561/13
 */
describe('network connection', () => {
    before(global.setupInstance)

    it('should response with assertions helper', async function () {
        mock('get', '/session/123ABC/network_connection', { value: 0 })
        let connection = await this.client.getNetworkConnection()
        connection.inAirplaneMode.should.be.false
        connection.hasWifi.should.be.false
        connection.hasData.should.be.false

        mock('get', '/session/123ABC/network_connection', { value: 1 })
        connection = await this.client.getNetworkConnection()
        connection.inAirplaneMode.should.be.true
        connection.hasWifi.should.be.false
        connection.hasData.should.be.false

        mock('get', '/session/123ABC/network_connection', { value: 2 })
        connection = await this.client.getNetworkConnection()
        connection.inAirplaneMode.should.be.false
        connection.hasWifi.should.be.true
        connection.hasData.should.be.false

        mock('get', '/session/123ABC/network_connection', { value: 4 })
        connection = await this.client.getNetworkConnection()
        connection.inAirplaneMode.should.be.false
        connection.hasWifi.should.be.false
        connection.hasData.should.be.true

        mock('get', '/session/123ABC/network_connection', { value: 6 })
        connection = await this.client.getNetworkConnection()
        connection.inAirplaneMode.should.be.false
        connection.hasWifi.should.be.true
        connection.hasData.should.be.true
    })

    it('should set connection data properly', async function() {
        const r = mock('post', '/session/123ABC/network_connection', null, { type: 4 })
        await this.client.setNetworkConnection(4)
        r.isDone().should.be.true
    })

    it('should throw if network value is invalid', async function() {
        let error

        try {
            await this.client.setNetworkConnection(3)
        } catch (e) {
            error = e.message
        } finally {
            expect(error.match(/while in airplane mode/)).not.to.be.null
        }

        try {
            await this.client.setNetworkConnection(5)
        } catch (e) {
            error = e.message
        } finally {
            expect(error.match(/while in airplane mode/)).not.to.be.null
        }

        try {
            await this.client.setNetworkConnection(7)
        } catch (e) {
            error = e.message
        } finally {
            expect(error.match(/invalid value/)).not.to.be.null
        }

        try {
            await this.client.setNetworkConnection(-1)
        } catch (e) {
            error = e.message
        } finally {
            expect(error.match(/invalid value/)).not.to.be.null
        }
    })
})
