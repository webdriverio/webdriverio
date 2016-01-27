import path from 'path'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('wdio multiremote should be able to select suites via cli', () => {
    it('should not overwrite specs if no suite is given', () => {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {})
        let specs = launcher.configParser.getSpecs()
        specs.should.have.length(1)
        specs[0].should.contain('index.js')
    })

    it('should overwrite spec property if suite param exists', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
            suite: 'suiteA'
        })
        let specs = launcher.configParser.getSpecs()
        specs.should.have.length(2)
        specs[0].should.endWith('setup-unit.js')
        specs[1].should.endWith('setup.js')
    })

    it('should not overwrite spec property if suite is not defined', async function () {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
            suite: 'foo'
        })
        let specs = launcher.configParser.getSpecs()
        specs.should.have.length(1)
        specs[0].should.endWith('index.js')
    })
})
