import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('wdio provides error hooks', () => {
    it('should run stale element retry tests without error', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'stale.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })

    it('should run custom error sync tests without error', async function() {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'custom.error.sync.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })

    it('should run custom error promise tests without error', async function() {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'custom.error.promise.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
