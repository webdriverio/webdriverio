import path from 'path'
import ConfigParser from '../../../lib/utils/ConfigParser'

const FIXTURES_PATH = path.resolve(__dirname, '..', '..', 'fixtures')

describe('ConfigParser', () => {
    it('should exclude files', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        let specs = configParser.getSpecs()
        specs.should.not.include(__filename)
        specs.should.include(path.resolve(__dirname, 'call.js'))
    })

    it('should exclude/include capability excludes', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude2.conf.js'))
        let specs = configParser.getSpecs(
            [path.resolve(FIXTURES_PATH, 'exclude*')],
            [path.resolve(__dirname, 'call.js')]
        )
        specs.should.not.include(__filename)
        specs.should.not.include(path.resolve(__dirname, 'call.js'))
        specs.should.include(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        specs.should.include(path.resolve(FIXTURES_PATH, 'exclude2.conf.js'))
    })

    it('should allow to specify a single suite', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ suite: 'mobile' })
        let specs = configParser.getSpecs()
        specs.should.not.include(path.resolve(__dirname, 'configparser.js'))
        specs.should.not.include(path.resolve(__dirname, 'pause.js'))
        specs.should.not.include(path.resolve(__dirname, '..', 'functional/selectorExecute.js'))
        specs.should.not.include(path.resolve(__dirname, '..', 'functional/promises.js'))
        specs.should.not.include(path.resolve(__dirname, '..', 'mobile/context.js'))
        specs.should.include(path.resolve(__dirname, '..', 'mobile/orientation.js'))
        specs.should.include(path.resolve(__dirname, '..', 'mobile/settings.js'))
    })

    it('should allow to specify multiple suites', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ suite: 'unit,functional,mobile' })
        let specs = configParser.getSpecs()
        specs.should.not.include(path.resolve(__dirname, 'configparser.js'))
        specs.should.not.include(path.resolve(__dirname, '..', 'functional/selectorExecute.js'))
        specs.should.not.include(path.resolve(__dirname, '..', 'mobile/context.js'))
        specs.should.include(path.resolve(__dirname, 'network.js'))
        specs.should.include(path.resolve(__dirname, '..', 'mobile/orientation.js'))
        specs.should.include(path.resolve(__dirname, '..', 'functional/end.js'))
    })

    it('should throw when suite is not defined', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ suite: 'blabla' })
        expect(() => configParser.getSpecs()).to.throw(/The suite\(s\) "blabla" you specified don't exist/)
    })

    it('should throw when multiple suites are not defined', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ suite: 'blabla,lala' })
        expect(() => configParser.getSpecs()).to.throw(/The suite\(s\) "blabla", "lala" you specified don't exist/)
    })

    it('should include typescript files', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        let specs = configParser.getSpecs([path.resolve(FIXTURES_PATH, '*.ts')])
        specs.should.not.include(__filename)
        specs.should.include(path.resolve(path.resolve(FIXTURES_PATH, 'typescript.ts')))
    })

    it('should set proper host and port to local selenium if no user and key is specified', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ foo: 'bar' })

        let config = configParser.getConfig()
        config.host.should.be.equal('127.0.0.1')
        config.port.should.be.equal(4444)
        config.foo.should.be.equal('bar')
    })

    it('should set proper host and port to local selenium if user and key is specified', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'remote.wdio.conf.js'))

        let config = configParser.getConfig()
        config.host.should.be.equal('ondemand.saucelabs.com')
        config.port.should.be.equal(443)
        config.user.should.be.equal('foobar')
        config.key.should.be.equal('50fa142c-3121-4gb0-9p07-8q326vvbq7b0')
    })

    it('should overwrite host and port if key are set as cli arguments', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude.conf.js'))
        configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

        let config = configParser.getConfig()
        config.host.should.be.equal('ondemand.saucelabs.com')
        config.port.should.be.equal(443)
        config.user.should.be.equal('barfoo')
        config.key.should.be.equal('50fa1411-3121-4gb0-9p07-8q326vvbq7b0')
    })

    it('should not overwrite host and port if specified in host file', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'exclude2.conf.js'))
        configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

        let config = configParser.getConfig()
        config.host.should.be.equal('172.168.0.1')
        config.port.should.be.equal(4445)
    })

    it('should allow an array of methods for hooks', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'multiHook.conf.js'))

        let config = configParser.getConfig()
        config.beforeHook[0]().should.be.equal('beforeHook: I executed properly')
        config.before[0]().should.be.equal('before: I executed properly')
        config.after[0]().should.be.equal('after: I executed properly')
        config.after[1]().should.be.equal('anonymous: I executed properly')
    })

    it('should parse beforeSession hook from config file', () => {
        let configParser = new ConfigParser()
        configParser.getConfig().beforeSession.should.be.an('array').and.be.empty
        configParser.getConfig().afterSession.should.be.an('array').and.be.empty
        configParser.addConfigFile(FIXTURES_PATH + '/empty.conf.js')
        configParser.getConfig().beforeSession.should.be.an('array').and.have.a.lengthOf(1)
        configParser.getConfig().afterSession.should.be.an('array').and.have.a.lengthOf(1)
    })
})
