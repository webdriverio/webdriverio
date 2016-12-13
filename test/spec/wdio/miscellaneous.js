import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('miscellaneous scenarios', () => {
    it('should not propagate prototype of call commands', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'element.wdio.conf'), {
            suite: 'call'
        })
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
