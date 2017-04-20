import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('wdio provides hooks', () => {
    it('should provide before/after session hook', async function () {
        const start = Date.now()
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'sessionHooks.conf.js'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
        expect(Date.now() - start).to.be.greaterThan(7000)
    })
})
