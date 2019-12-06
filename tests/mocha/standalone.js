import assert from 'assert'
import { remote } from '../../packages/webdriverio'
import { runSync } from '../../packages/wdio-sync'

describe('scripts run in standalone mode', () => {
    it('should allow to run standalone mode synchronously', async () => {
        return remote({
            runner: true,
            hostname: 'localhost',
            port: 4444,
            path: '/',
            capabilities: {
                browserName: 'chrome'
            }
        }).then((remoteBrowser) => new Promise((resolve, reject) => runSync(() => {
            assert.equal(remoteBrowser.getTitle(), 'Mock Page Title')
        })(resolve, reject)))
    })
})
