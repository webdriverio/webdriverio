import path from 'path'
import sinon from 'sinon'
import Launcher from '../../../build/lib/launcher'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('launcher', () => {
    describe('allows to define run specific suites', () => {
        it('should not overwrite specs if no suite is given', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {})
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(1)
            specs[0].should.contain('index.js')
        })

        it('should overwrite spec property if suite param exists', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                suite: 'suiteA'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(2)
            specs[0].should.endWith('setup-unit.js')
            specs[1].should.endWith('setup.js')
        })

        it('should not overwrite spec property if suite is not defined', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                suite: 'foo'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(1)
            specs[0].should.endWith('index.js')
        })
    })

    describe('runSpec', () => {
        let launcher
        let caps = [{
            browserName: 'phantomjs'
        }, {
            browserName: 'phantomjs'
        }, {
            browserName: 'phantomjs'
        }, {
            browserName: 'phantomjs'
        }, {
            browserName: 'phantomjs'
        }]

        function getLauncer (args, numberOfSpecs = 20) {
            launcher = new Launcher(path.join(FIXTURE_ROOT, 'runspec.wdio.conf.js'), args)
            launcher.configParser.getSpecs = () => Object.assign('/foo/bar.js,'.repeat(numberOfSpecs).split(',').slice(0, -1))
            launcher.configParser.getCapabilities = () => Object.assign(caps)
            launcher.startInstance = sinon.spy()
            return launcher
        }

        it('should run all specs if no limitations are given (full concurrency)', async () => {
            launcher = getLauncer()
            setTimeout(() => launcher.resolve(0), 10)
            await launcher.run()
            launcher.startInstance.callCount.should.be.equal(100)
        })

        it('should run max maxInstances', async () => {
            launcher = getLauncer({
                maxInstances: 10
            }, 4)
            setTimeout(() => launcher.resolve(0), 10)
            await launcher.run()
            launcher.startInstance.callCount.should.be.equal(10)

            launcher.startInstance.reset()
            launcher.schedule[0].runningInstances--
            launcher.schedule[0].availableInstances++
            launcher.runSpecs().should.be.not.ok
            launcher.startInstance.callCount.should.be.equal(1)

            launcher.startInstance.reset()
            launcher.schedule.forEach((cap) => {
                cap.runningInstances--
                cap.availableInstances++
            })
            launcher.runSpecs().should.be.not.ok
            launcher.startInstance.callCount.should.be.equal(5)

            launcher.startInstance.reset()
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 100
            })
            launcher.runSpecs().should.be.not.ok
            launcher.startInstance.callCount.should.be.equal(4)
            launcher.startInstance.reset()
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 100
            })
            launcher.runSpecs().should.be.ok
            launcher.startInstance.callCount.should.be.equal(0)
        })

        it('should respect maxInstances property of a single capabiltiy', async () => {
            launcher = getLauncer({}, 5)
            launcher.configParser.getCapabilities = () => Object.assign(caps).map((a, i) => {
                a.maxInstances = i + 1
                return a
            })
            setTimeout(() => launcher.resolve(0), 10)
            await launcher.run()
            launcher.startInstance.callCount.should.be.equal(15)

            launcher.startInstance.reset()
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 100
            })
            launcher.runSpecs().should.be.not.ok
            launcher.startInstance.callCount.should.be.equal(10)
            launcher.startInstance.reset()
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 100
            })
            launcher.runSpecs().should.be.ok
            launcher.startInstance.callCount.should.be.equal(0)
        })

        afterEach(() => {
            launcher.startInstance.reset()
        })
    })
})
