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
})
