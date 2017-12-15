import path from 'path'
import sinon from 'sinon'
import Launcher from '../../../build/lib/launcher'
import mock from 'mock-require'

const FIXTURE_ROOT = path.join(__dirname, '..', '..', 'fixtures')

describe('launcher', () => {
    describe('allows to define run specific suites', () => {
        it('should not overwrite specs if no suite is given', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {})
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(1)
            specs[0].should.contain('index.js')
        })

        it('should get suite specs', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                suite: 'suiteA'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(2)
            specs[0].should.endWith('setup-unit.js')
            specs[1].should.endWith('setup.js')
        })

        it('should get suite specs and individual specs', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                suite: 'suiteA',
                spec: 'index.js'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(3)
            specs[0].should.endWith('index.js')
            specs[1].should.endWith('setup-unit.js')
            specs[2].should.endWith('setup.js')
        })

        it('should not overwrite spec property if suite is not defined', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                suite: 'foo'
            })
            expect(() => launcher.configParser.getSpecs()).to.throw(/The suite\(s\) "foo" you specified don't exist/)
        })

        it('should allow to pass spec as cli argument to run only one test file', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                spec: './test/spec/unit/launcher.js'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(1)
            specs[0].should.endWith(path.resolve('test', 'spec', 'unit', 'launcher.js'))
        })

        it('should allow to pass multiple specs as cli argument to run only these test files', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                spec: './test/spec/unit/launcher.js,./lib/webdriverio.js'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(2)
            specs[0].should.endWith(path.resolve('test', 'spec', 'unit', 'launcher.js'))
            specs[1].should.endWith(path.resolve('lib', 'webdriverio.js'))
        })

        it('should filter specs with spec as a cli argument', () => {
            let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                spec: 'index'
            })
            let specs = launcher.configParser.getSpecs()
            specs.should.have.length(1)
            specs[0].should.contain('index.js')
        })

        it('should throw if specified spec file doesnt exist', () => {
            expect(() => new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {
                spec: './foobar.js'
            })).to.throw(/spec file \.\/foobar\.js not found/)
        })
    })

    it('should exit if no spec was found', () => {
        const launcher = new Launcher(path.join(FIXTURE_ROOT, 'empty.conf.js'), {})
        return launcher.run().then((exitCode) => {
            expect(exitCode).to.be.equal(0)
        })
    })

    it('should assign proper runner ids using getRunnerId', () => {
        let launcher = new Launcher(path.join(FIXTURE_ROOT, 'suite.wdio.conf.js'), {})
        expect(launcher.getRunnerId(0)).to.be.equal('0-0')
        expect(launcher.getRunnerId(0)).to.be.equal('0-1')
        expect(launcher.getRunnerId(0)).to.be.equal('0-2')
        expect(launcher.getRunnerId(0)).to.be.equal('0-3')
        expect(launcher.getRunnerId(5)).to.be.equal('5-0')
        expect(launcher.getRunnerId(5)).to.be.equal('5-1')
        expect(launcher.getRunnerId(5)).to.be.equal('5-2')
        expect(launcher.getRunnerId(5)).to.be.equal('5-3')
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

        it('should stop launching runners after bail number is reached', async () => {
            launcher = getLauncer({
                maxInstances: 1,
                bail: 2
            }, 5)
            setTimeout(() => launcher.resolve(0), 10)

            await launcher.run()
            launcher.startInstance.callCount.should.be.equal(1)
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 1
            })

            launcher.runSpecs().should.be.not.ok
            launcher.runnerFailed++
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 1
            })
            launcher.runSpecs().should.be.not.ok
            launcher.runnerFailed++
            launcher.schedule.forEach((cap) => {
                cap.runningInstances = 0
                cap.availableInstances = 1
            })
            launcher.runSpecs().should.be.ok
        })

        afterEach(() => {
            launcher.startInstance.reset()
        })
    })

    describe('loads launch services', () => {
        it('should load a launcher service', () => {
            const launcher = path.join(FIXTURE_ROOT, 'services', 'wdio-awesome-service', 'launcher')
            mock('wdio-awesome-service/launcher', launcher)
            expect(
                Launcher.prototype.getLauncher({ services: ['awesome'] })
            ).to.have.lengthOf(1)
            mock.stop('wdio-awesome-service/launcher')
        })

        it('should allow to load scoped packages', () => {
            const launcher = path.join(FIXTURE_ROOT, 'services', 'wdio-awesome-service', 'launcher')
            mock('@scope/wdio-awesome-service/launcher', launcher)
            expect(
                Launcher.prototype.getLauncher({ services: ['@scope/wdio-awesome-service'] })
            ).to.have.lengthOf(1)
            mock.stop('@scope/wdio-awesome-service/launcher')
        })

        it('should throw if a service launcher fails', () => {
            const launcher = path.join(FIXTURE_ROOT, 'services', 'wdio-launcher-failure-service', 'launcher')
            mock('wdio-launcher-failure-service/launcher', launcher)
            expect(() => {
                Launcher.prototype.getLauncher({ services: ['launcher-failure'] })
            }).to.throw(/Cannot find module 'some-missing-module'/)
            mock.stop('wdio-launcher-failure-service/launcher')
        })

        it('should proceed if the service launcher doesn\'t exist', () => {
            expect(() => {
                Launcher.prototype.getLauncher({ services: ['launcher-missing'] })
            }).to.not.throw(/Cannot find module/)
        })
    })
})
