import path from 'path'
import ConfigParser from '../../../lib/utils/ConfigParser'

const FIXTURES_PATH = __dirname + '/../../fixtures'

describe('ConfigParser', () => {
    it('should exclude files', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude.conf.js')
        let specs = configParser.getSpecs()
        specs.should.not.include(__filename)
        specs.should.include(path.resolve(__dirname + '/call.js'))
    })

    it('should exclude/include capability excludes', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude2.conf.js')
        let specs = configParser.getSpecs(
            [FIXTURES_PATH + '/exclude*'],
            [__dirname + '/call.js']
        )
        specs.should.not.include(__filename)
        specs.should.not.include(path.resolve(__dirname + '/call.js'))
        specs.should.include(path.resolve(FIXTURES_PATH + '/exclude.conf.js'))
        specs.should.include(path.resolve(FIXTURES_PATH + '/exclude2.conf.js'))
    })

    it('should include typescript files', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude.conf.js')
        let specs = configParser.getSpecs([FIXTURES_PATH + '/*.ts'])
        specs.should.not.include(__filename)
        specs.should.include(path.resolve(FIXTURES_PATH + '/typescript.ts'))
    })

    it('should set proper host and port to local selenium if no user and key is specified', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude.conf.js')
        configParser.merge({ foo: 'bar' })

        let config = configParser.getConfig()
        config.host.should.be.equal('127.0.0.1')
        config.port.should.be.equal(4444)
        config.foo.should.be.equal('bar')
    })

    it('should set proper host and port to local selenium if user and key is specified', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/remote.wdio.conf.js')

        let config = configParser.getConfig()
        config.host.should.be.equal('ondemand.saucelabs.com')
        config.port.should.be.equal(80)
        config.user.should.be.equal('foobar')
        config.key.should.be.equal('50fa142c-3121-4gb0-9p07-8q326vvbq7b0')
    })

    it('should overwrite host and port if key are set as cli arguments', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude.conf.js')
        configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

        let config = configParser.getConfig()
        config.host.should.be.equal('ondemand.saucelabs.com')
        config.port.should.be.equal(80)
        config.user.should.be.equal('barfoo')
        config.key.should.be.equal('50fa1411-3121-4gb0-9p07-8q326vvbq7b0')
    })

    it('should not overwrite host and port if specified in host file', () => {
        let configParser = new ConfigParser()
        configParser.addConfigFile(FIXTURES_PATH + '/exclude2.conf.js')
        configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

        let config = configParser.getConfig()
        config.host.should.be.equal('172.168.0.1')
        config.port.should.be.equal(4445)
    })
})
