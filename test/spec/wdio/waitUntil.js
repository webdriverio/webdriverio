import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('waitUntil', () => {
    it('should to execute commands in condition synchronously', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'waitUntil.conf'), {
            suite: 'sync'
        })
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })

    it('should to execute commands in condition asynchronously', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'waitUntil.conf'), {
            suite: 'async',
            sync: false
        })
        expect(await launcher.run()).to.be.equal(0, 'wdio command failed unexpected')
    })
})
