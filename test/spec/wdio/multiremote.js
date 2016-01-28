import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('wdio multiremote', () => {
    it('should be able to run multiremote tests', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'multiremote.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
