import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('element first class citizen', () => {
    it('should be able to run element tests', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'element.wdio.conf'), {
            suite: 'elementAsFirstCitizen'
        })
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
