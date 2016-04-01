import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('custom commands', () => {
    it('should be chainable in async mode', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'custom.commands.wdio.conf'), {})
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
