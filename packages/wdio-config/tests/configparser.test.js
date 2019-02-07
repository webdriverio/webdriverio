import path from 'path'
import ConfigParser from '../src/lib/ConfigParser'

const FIXTURES_PATH = path.resolve(__dirname, '__fixtures__')
const FIXTURES_CONF = path.resolve(FIXTURES_PATH, 'wdio.conf.js')
const FIXTURES_CONF_RDC = path.resolve(FIXTURES_PATH, 'wdio.conf.rdc.js')
const FIXTURES_CONF_MULTIREMOTE_RDC = path.resolve(FIXTURES_PATH, 'wdio.conf.multiremote.rdc.js')
const FIXTURES_LOCAL_CONF = path.resolve(FIXTURES_PATH, 'wdio.local.conf.js')
const INDEX_PATH = path.resolve(__dirname, '..', 'src', 'index.js')

describe('ConfigParser', () => {
    it('should throw if getFilePaths is not a string', () => {
        expect(() => ConfigParser.getFilePaths(123)).toThrow()
    })

    describe('addConfigFile', () => {
        it('should throw if config file is not a string', () => {
            const configParser = new ConfigParser()
            expect(() => configParser.addConfigFile(123)).toThrow()
        })

        it('should throw if config file does not exist', () => {
            const configParser = new ConfigParser()
            expect(() => configParser.addConfigFile(path.resolve(__dirname, 'foobar.conf.js'))).toThrow()
        })

        it('should add the rdc hostname when a rdc conf is provided', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF_RDC)
            expect(configParser._config.hostname).toContain('appium.testobject.com')
        })

        it('should default to the vm hostname when a multiremote conf with rdc props is provided', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF_MULTIREMOTE_RDC)
            expect(configParser._config.hostname).not.toContain('appium.testobject.com')
        })
    })

    describe('merge', () => {
        it('should overwrite specs if piped into cli command', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ specs: INDEX_PATH })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying a spec file', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying mutliple single spec file', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : [INDEX_PATH, FIXTURES_CONF]})

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow to specify partial matching spec file', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : ['Plugin']})

            const specs = configParser.getSpecs()
            expect(specs).toContain(path.join(__dirname, 'initialisePlugin.test.js'))
        })

        it('should exclude duplicate spec files', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : [INDEX_PATH, INDEX_PATH]})

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should throw if specified spec file does not exist', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            expect(() => configParser.merge({ spec: [path.resolve(__dirname, 'foobar.js')] })).toThrow()
        })

        it('should allow to specify multiple suites', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['unit', 'functional', 'mobile']})

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'validateConfig.test.js'))
            expect(specs).toContain(path.join(__dirname, 'detectBackend.test.js'))
        })

        it('should throw when suite is not defined', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['blabla'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla" you specified don't exist/)
        })

        it('should throw when multiple suites are not defined', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['blabla', 'lala'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla", "lala" you specified don't exist/)
        })

        it('should allow to specify a single suite', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['mobile'] })

            let specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(path.join(__dirname, 'detectBackend.test.js'))
        })

        it('should overwrite host and port if key are set as cli arguments', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

            const config = configParser.getConfig()
            expect(config.hostname).toBe('ondemand.saucelabs.com')
            expect(config.port).toBe(443)
            expect(config.user).toBe('barfoo')
            expect(config.key).toBe('50fa1411-3121-4gb0-9p07-8q326vvbq7b0')
        })

        it('should not overwrite host and port if specified in host file', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_LOCAL_CONF)
            configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

            const config = configParser.getConfig()
            expect(config.hostname).toBe('ondemand.saucelabs.com')
            expect(config.port).toBe(443)
        })

        it('should allow specifying a exclude file', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH, FIXTURES_CONF] })
            configParser.merge({ exclude: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow specifying multiple exclude files', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH, FIXTURES_CONF] })
            configParser.merge({ exclude: [INDEX_PATH, FIXTURES_CONF] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(0)
        })

        it('should throw if specified exclude file does not exist', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            expect(() => configParser.merge({ exclude: [path.resolve(__dirname, 'foobar.js')] })).toThrow()
        })

        it('should overwrite exclude if piped into cli command', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ exclude: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(4)
        })
    })

    describe('addService', () => {
        it('should only add functions', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.addService({
                before: undefined,
                beforeTest: 123,
                afterTest: () => 'foobar',
                after: [1, () => 'barfoo', () => 'lala']
            })

            expect(configParser._config.before).toHaveLength(0)
            expect(configParser._config.beforeTest).toHaveLength(0)
            expect(configParser._config.afterTest).toHaveLength(1)
            expect(configParser._config.after).toHaveLength(2)
        })
    })

    describe('getCapabilities', () => {
        it('allows to grab certain capabilities', () => {
            const configParser = new ConfigParser()
            configParser._capabilities = ['foo', 'bar']
            expect(configParser.getCapabilities()).toEqual(configParser._capabilities)
            expect(configParser.getCapabilities(1)).toEqual('bar')
        })
    })

    describe('getSpecs', () => {
        it('should exclude files', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'detectBackend.test.js'))
        })

        it('should exclude/include capability excludes', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const specs = configParser.getSpecs([INDEX_PATH], [__filename])
            expect(specs).not.toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'detectBackend.test.js'))
            expect(specs).toContain(INDEX_PATH)
        })

        it('should include typescript files', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const tsFile = path.resolve(FIXTURES_PATH, '*.ts')
            const specs = configParser.getSpecs([tsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'typescript.ts'))
        })

        it('should include es6 files', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const es6File = path.resolve(FIXTURES_PATH, '*.es6')
            const specs = configParser.getSpecs([es6File])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.es6'))
        })

        it('should not include other file types', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const javaFile = path.resolve(FIXTURES_PATH, '*.java')
            const specs = configParser.getSpecs([javaFile])
            expect(specs).not.toContain(javaFile)
        })

        it('should include spec when specifying a suite', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['mobile'], spec: [INDEX_PATH] })

            let specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'detectBackend.test.js'))
        })
    })

    describe('getConfig', () => {
        it('should set proper host and port to local selenium if user and key is specified', () => {
            const configParser = new ConfigParser()
            configParser.addConfigFile(FIXTURES_CONF)

            const config = configParser.getConfig()
            expect(config.hostname).toBe('ondemand.saucelabs.com')
            expect(config.port).toBe(443)
            expect(config.user).toBe('foobar')
            expect(config.key).toBe('50fa142c-3121-4gb0-9p07-8q326vvbq7b0')
        })
    })
})
