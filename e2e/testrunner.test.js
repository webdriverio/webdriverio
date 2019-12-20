import assert from 'assert'
import Launcher from '../packages/wdio-cli/src/launcher.js'

jest.setTimeout(1000 * 60)

test('should allow to run multiple browser at once', async () => {
    const launcher = new Launcher(`${__dirname}/wdio/wdio.conf.js`)
    const failures = await launcher.run()
    assert.equal(failures, 0)
})
