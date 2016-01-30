import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('promised based async handling', () => {
    it('should be able to switch back to promised based behavior', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'async.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
