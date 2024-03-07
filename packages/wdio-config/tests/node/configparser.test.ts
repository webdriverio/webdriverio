import url from 'node:url'
import path from 'node:path'

import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
// @ts-expect-error
import babelRegister from '@babel/register'
import logger from '@wdio/logger'

import ConfigParser from '../../src/node/ConfigParser.js'
import type { MockFileContent } from '../lib/MockFileContentBuilder.js'
import MockFileContentBuilder from '../lib/MockFileContentBuilder.js'
import type { FilePathsAndContents, MockSystemFilePath, MockSystemFolderPath } from '../lib/MockPathService.js'
import ConfigParserBuilder from '../lib/ConfigParserBuilder.js'
import { FileNamed, realReadFilePair, realRequiredFilePair } from '../lib/FileNamed.js'

const log = logger('')
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const root = path.resolve(__dirname, '..', '..')

const FIXTURES_PATH = path.resolve(__dirname, '..', '__fixtures__')
const FIXTURES_CONF = path.resolve(FIXTURES_PATH, 'wdio.conf.ts')
const FIXTURES_CONF_RDC = path.resolve(FIXTURES_PATH, 'wdio.conf.rdc.ts')
const FIXTURES_CONF_ARRAY = path.resolve(FIXTURES_PATH, 'wdio.array.conf.ts')
const FIXTURES_LOCAL_CONF = path.resolve(FIXTURES_PATH, 'wdio.local.conf.ts')
const FIXTURES_PREFIX_CONF = path.resolve(FIXTURES_PATH, 'wdio.wdio-prefix.conf.ts')
const FIXTURES_DEFAULT_CONF = path.resolve(FIXTURES_PATH, 'wdio.default.conf.ts')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2 = path.resolve(FIXTURES_PATH, 'test-a.feature:2')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12 = path.resolve(FIXTURES_PATH, 'test-a.feature:2:12')
const FIXTURES_CUCUMBER_FEATURE_B_LINE_7 = path.resolve(FIXTURES_PATH, 'test-b.feature:7')
const INDEX_PATH = path.resolve(__dirname, '..', '..', 'src', 'index.ts')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('ts-node', () => ({
    default: { register: vi.fn() }
}))

vi.mock('@babel/register', () => ({
    default: vi.fn()
}))

/**
 * Entirely in memory config structure to avoid reading the file system at all
 *
 * Ideally we wouldn't need a fixtures folder, or it would have very minimal files in it and changes
 * needed for tests would be modified on top of it.
 *
 * This is provided as a step to that direction.
 *
 * @constructor
 */
// eslint-disable-next-line camelcase
const TestWdioConfig_AllInMemory = (): MockFileContent => ({
    config: {
        user: 'foobar',
        key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
        specs: [path.join(root, '/tests/*.test.ts')],
        exclude: [
            path.join(root, '/tests/validateConfig.test.ts')
        ],
        capabilities: [{
            browserName: 'chrome'
        }],
        suites: {
            unit: [path.join(root, '/tests/configparser.test.ts')],
            mobile: [path.join(root, '/tests/node/FileSystemPathService.test.ts')],
            functional: [
                path.join(root, '/tests/validateConfig.test.ts'),
                path.join(root, '/tests/..', 'src/index.ts')
            ]
        }
    }
})

/**
 * Represent everything in the fixtures directory (at time of writing)
 *
 * All ts files are read and configs are loaded in from disk, so all
 * parsing facilities should work as they would with the real file system.
 *
 * @constructor
 */
// eslint-disable-next-line camelcase
async function MockedFileSystem_LoadingAsMuchAsCanFromFileSystem(): Promise<FilePathsAndContents> {
    return [
        realReadFilePair(path.resolve(FIXTURES_PATH, '../validateConfig.test.ts')),
        realReadFilePair(path.resolve(FIXTURES_PATH, '../node/configparser.test.ts')),
        realReadFilePair(path.resolve(FIXTURES_PATH, '../utils.test.ts')),
        realReadFilePair(path.resolve(FIXTURES_PATH, '../node/FileSystemPathService.test.ts')),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.cjs')).withContents('test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.es6')).withContents('test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.java')).withContents('test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.mjs')).withContents('test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test-a.feature')).withContents('feature file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test-b.feature')).withContents('feature file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'typescript.ts')).withContents('test file contents'),
        await realRequiredFilePair(path.resolve(FIXTURES_PATH, 'wdio.array.conf.ts')),
        await realRequiredFilePair(path.resolve(FIXTURES_PATH, 'wdio.conf.multiremote.rdc.ts')),
        await realRequiredFilePair(path.resolve(FIXTURES_PATH, 'wdio.conf.rdc.ts')),
        await realRequiredFilePair(path.resolve(FIXTURES_PATH, 'wdio.conf.ts')),
        await realRequiredFilePair(path.resolve(FIXTURES_PATH, 'wdio.local.conf.ts')),
        await realRequiredFilePair(path.resolve(INDEX_PATH))
    ]
}

/**
 * Represent everything in the fixtures directory (at time of writing)
 *
 * Should be fast b/c only loads config, and should work for most machinery.
 * But if anything requires configs recursively loading other configs, you
 * probably want to use MockedFileSystem_LoadingAsMuchAsCanFromFileSystem instead.
 * @param configFilepath
 * @constructor
 */
// eslint-disable-next-line camelcase
function MockedFileSystem_OnlyLoadingConfig(baseDir: MockSystemFolderPath, configFilepath: MockSystemFilePath): FilePathsAndContents {
    return [
        FileNamed(configFilepath).withContents(TestWdioConfig_AllInMemory()),
        FileNamed(path.join(baseDir, '../validateConfig.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../node/configparser.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../utils.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../node/FileSystemPathService.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.cjs')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.es6')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.java')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.mjs')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test-a.feature')).withContents('feature file contents'),
        FileNamed(path.join(baseDir, 'test-b.feature')).withContents('feature file contents'),
        FileNamed(path.join(baseDir, 'typescript.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'prefix-test-01.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'prefix-test-02.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.multiremote.rdc.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.rdc.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.local.conf.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.wdio-prefix.conf.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, '../app/src/index.ts')).withContents('source contents')]
}

function ConfigParserForTest(config = FIXTURES_CONF) {
    return ConfigParserBuilder.withBaseDir(FIXTURES_PATH, config)
        .withFiles(
            MockedFileSystem_OnlyLoadingConfig(FIXTURES_PATH, config)
        ).build()
}

async function ConfigParserForTestWithAllFiles(configPath: string, args = {}) {
    return ConfigParserBuilder.withBaseDir(FIXTURES_PATH, configPath, args)
        .withFiles(
            await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem()
        ).build()
}

describe('ConfigParser', () => {
    it('should throw if getFilePaths is not a string', () => {
        expect(() => ConfigParser.getFilePaths(123 as any, '/foo/bar')).toThrow()
    })

    it('enables coverage', async () => {
        const c1 = new ConfigParser('/wdio.conf.js', { coverage: true })
        c1['addConfigFile'] = vi.fn()
        c1['merge'] = vi.fn()
        c1['_config'] = { runner: 'browser', autoCompileOpts: { autoCompile: false } } as any
        await c1.initialize({})
        expect(c1['_config']).toMatchSnapshot()

        const c2 = new ConfigParser('/wdio.conf.js', { coverage: true })
        c2['addConfigFile'] = vi.fn()
        c2['merge'] = vi.fn()
        c2['_config'] = {
            runner: ['browser', {
                coverage: { enabled: false, statements: 100 }
            }],
            autoCompileOpts: { autoCompile: false }
        } as any
        await c2.initialize({})
        expect(c2['_config']).toMatchSnapshot()
    })

    it('disables coverage', async () => {
        const c1 = new ConfigParser('/wdio.conf.js', { coverage: false })
        c1['addConfigFile'] = vi.fn()
        c1['merge'] = vi.fn()
        c1['_config'] = { runner: 'browser', autoCompileOpts: { autoCompile: false } } as any
        await c1.initialize({})
        expect(c1['_config']).toMatchSnapshot()

        const c2 = new ConfigParser('/wdio.conf.js', { coverage: false })
        c2['addConfigFile'] = vi.fn()
        c2['merge'] = vi.fn()
        c2['_config'] = {
            runner: ['browser', {
                coverage: { enabled: true, statements: 100 }
            }],
            autoCompileOpts: { autoCompile: false }
        } as any
        await c2.initialize({})
        expect(c2['_config']).toMatchSnapshot()
    })

    describe('addConfigFile', () => {
        it('should throw if config file is not a string', async () => {
            const configParser = await ConfigParserForTest()
            await expect(() => configParser['addConfigFile'](123 as any)).rejects.toThrow()
        })

        it('should throw if config file does not exist (absolute path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser['addConfigFile'](path.resolve(__dirname, 'foobar.conf.ts'))).rejects.toThrow()
        })

        it('should throw if config file does not exist (relative path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser['addConfigFile']('foobar.conf.ts')).rejects.toThrow()
        })

        it('should throw if config file is not a config file (absolute path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser['addConfigFile'](path.resolve(FIXTURES_PATH, 'test-a.feature'))).rejects.toThrow()
        })

        it('should throw if config file is not a config file (relative path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser['addConfigFile']('test-a.feature')).rejects.toThrow()
        })

        describe('Babel integration', () => {
            beforeEach(() => {
                (log.debug as MockedFunction<any>).mockClear()
                delete process.env.THROW_BABEL_REGISTER
                delete process.env.THROW_TSNODE_RESOLVE
                delete process.env.WDIO_WORKER_ID
            })

            it('when @babel/register package exists should initiate with @babel/register compiler', async () => {
                process.env.THROW_TSNODE_RESOLVE = '1'
                const configContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).build()
                const babelRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH, FIXTURES_CONF_RDC)
                    .withFiles([
                        FileNamed(FIXTURES_CONF_RDC).withContents(configContents)
                    ]
                    )
                    .withBabelModule(babelRegister)
                    .build()
                await configParser.initialize()

                expect(babelRegister).toHaveBeenCalledWith({})
                expect(log.debug).toBeCalledTimes(2)
                expect((log.debug as MockedFunction<any>).mock.calls[1][0])
                    .toContain('auto-compiling files with Babel')
            })

            it('should not transpile via ts-node if we are within the worker', async function () {
                process.env.WDIO_WORKER_ID = '0-0'
                const configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).build()
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(FIXTURES_PATH, '/here'), 'cool.conf')
                    .withTsNodeModule(tsNodeRegister)
                    .withFiles([
                        ...(await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem()),
                        FileNamed(path.join(FIXTURES_PATH, '/here/cool.conf')).withContents(configFileContents)
                    ])
                    .build()
                await configParser.initialize()
                expect(tsNodeRegister).toBeCalledTimes(0)
            })

            it('when @babel/register package exists should merge config, preferring config, if present', async function () {
                process.env.THROW_TSNODE_RESOLVE = '1'
                const configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).build()
                const babelRegister = vi.fn()
                const configParser = ConfigParserBuilder.withBaseDir(
                    path.join(__dirname, '/tests/'),
                    path.join(__dirname, '/tests/cool.conf'),
                    {
                        autoCompileOpts: {
                            babelOpts: {
                                'babel': 'do this',
                                'and': 'that'
                            }
                        }
                    }
                ).withFiles([
                    FileNamed(path.join(__dirname, '/tests/cool.conf')).withContents(JSON.stringify(configFileContents)),
                    FileNamed(path.join(__dirname, '/tests/validateConfig.test.ts')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/node/configparser.test.ts')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/utils.test.ts')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/node/FileSystemPathService.test.ts')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test.cjs')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test.es6')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test.java')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test.mjs')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test-a.feature')).withContents('feature file contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/test-b.feature')).withContents('feature file contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/typescript.ts')).withContents('test contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/wdio.conf.multiremote.rdc.ts')).withContents('config contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/wdio.conf.rdc.ts')).withContents('config contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/wdio.conf.ts')).withContents('config contents'),
                    FileNamed(path.join(__dirname, '/tests/__fixtures__/wdio.local.conf.ts')).withContents('config contents'),
                    FileNamed(path.join(__dirname, '/app/src/index.ts')).withContents('source contents')
                ]).withBabelModule(babelRegister).build()
                await configParser.initialize()
                expect(babelRegister).toBeCalledTimes(1)
                expect(babelRegister).toHaveBeenCalledWith({
                    'babel': 'do this',
                    'and': 'that'
                })
            })

            it('should just continue without initiation when autoCompile:false', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                const babelRegister = vi.fn()
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH, FIXTURES_CONF_RDC, {
                        autoCompileOpts: {
                            autoCompile: false
                        }
                    })
                    .withBabelModule(babelRegister)
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(process.cwd(), FIXTURES_CONF_RDC)
                    ])
                const { requireMock } = configParserBuilder.getMocks().modules.getMocks()
                const configParser = configParserBuilder.build()
                await configParser.initialize()
                expect(requireMock).not.toHaveBeenCalled()
                expect(babelRegister).not.toHaveBeenCalled()
            })

            it('should just continue without initiation with --autoCompileOpts.autoCompile=false', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                const babelRegister = vi.fn()
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH, FIXTURES_CONF_RDC, {
                        autoCompileOpts: {
                            autoCompile: 'false'
                        }
                    })
                    .withBabelModule(babelRegister)
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(process.cwd(), FIXTURES_CONF_RDC)
                    ])
                const { requireMock } = configParserBuilder.getMocks().modules.getMocks()
                const configParser = configParserBuilder.build()
                await configParser.initialize()
                expect(requireMock).not.toHaveBeenCalled()
                expect(babelRegister).not.toHaveBeenCalled()
            })

            it('should just continue without initiation if @babel/register does not exist', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                process.env.THROW_TSNODE_RESOLVE = '1'
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH, FIXTURES_CONF_RDC)
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(FIXTURES_PATH, FIXTURES_CONF_RDC)
                    ])
                    .withNoModules()
                const configParser = configParserBuilder.build()
                await configParser.initialize()
                expect(babelRegister).not.toHaveBeenCalled()
                expect(log.debug).toBeCalledTimes(1)
                expect((log.debug as MockedFunction<any>).mock.calls[0][0])
                    .toContain('Failed loading TS Node')
            })
        })
    })

    describe('merge', () => {
        const isWindows = process.platform === 'win32'
        it('should overwrite specs if piped into cli command', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ specs: [INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying a spec file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying a spec file which is Cucumber feature file with line number', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            let featureFileWithoutLine = ''
            featureFileWithoutLine = isWindows
                ? FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[1]
                : FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0]
            expect(specs).toContain(featureFileWithoutLine)
        })

        it('should allow specifying a spec file which is Cucumber feature file with line numbers', async () => {
            const configParser = await ConfigParserForTest()
            await configParser['addConfigFile'](FIXTURES_CONF)
            configParser['merge']({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            let featureFileWithoutLine = ''
            featureFileWithoutLine = isWindows
                ? FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[1]
                : FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[0]
            expect(specs).toContain(featureFileWithoutLine)
        })

        it('should allow specifying a spec file which is Cucumber feature files with line number', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2, FIXTURES_CUCUMBER_FEATURE_B_LINE_7] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            let featureFileA = ''
            let featureFileB = ''
            if (isWindows) {
                featureFileA = FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[1]
                featureFileB = FIXTURES_CUCUMBER_FEATURE_B_LINE_7.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_B_LINE_7.split(':')[1]
            } else {
                featureFileA = FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0]
                featureFileB = FIXTURES_CUCUMBER_FEATURE_B_LINE_7.split(':')[0]
            }
            expect(specs).toContain(featureFileA)
            expect(specs).toContain(featureFileB)
        })

        it('should allow specifying mutliple single spec file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: [INDEX_PATH, FIXTURES_CONF] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow to specify partial matching spec file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: ['PathService'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
        })

        it('should handle an array in the config_specs', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)
            await configParser.initialize({ spec: ['PathService'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
        })

        it('should exclude duplicate spec files', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: [INDEX_PATH, INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should throw if specified spec file does not exist', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            const hasError = await configParser.initialize({ spec: [path.resolve(__dirname, 'foobar.ts')] })
                .then(() => false, () => true)
            expect(hasError).toBe(true)
        })

        it('should allow to specify multiple suites', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ suite: ['unit', 'functional', 'mobile'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
        })

        it('should throw when suite is not defined', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({ suite: ['blabla'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla" you specified don't exist/)
        })

        it('should throw when multiple suites are not defined', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({ suite: ['blabla', 'lala'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla", "lala" you specified don't exist/)
        })

        it('should allow to specify a single suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF, { suite: ['mobile'] })
            await configParser.initialize({ suite: ['mobile'] })

            const specs = configParser.getSpecs()
            // @ts-ignore
            const suite = configParser.getConfig().suite

            expect(suite).toHaveLength(1)
            expect(specs).toHaveLength(1)
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
        })

        it('should not overwrite host and port if specified in host file', async () => {
            const configParser = ConfigParserBuilder.withBaseDir(FIXTURES_PATH, FIXTURES_LOCAL_CONF)
                .withFiles(
                    [
                        FileNamed(FIXTURES_LOCAL_CONF).withContents({
                            config: {
                                hostname: '127.0.0.1',
                                port: 4444
                            }
                        })
                    ]
                ).build()
            await configParser.initialize({
                user: 'barfoo',
                key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0'
            })

            const config = configParser.getConfig()
            expect(config.hostname).toBe('127.0.0.1')
            expect(config.port).toBe(4444)
        })

        it('should be able to read config file if object is attached to default', async () => {
            const configParser = ConfigParserBuilder.withBaseDir(FIXTURES_PATH, FIXTURES_DEFAULT_CONF).withFiles([
                FileNamed(FIXTURES_DEFAULT_CONF).withContents({
                    default: {
                        config: { foo: 'bar' }
                    }
                })
            ]).build()
            await configParser.initialize()
            const config = configParser.getConfig()
            // @ts-expect-error
            expect(config['foo']).toBe('bar')
        })

        it('should allow specifying a exclude file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({
                spec: [INDEX_PATH, FIXTURES_CONF],
                exclude: [INDEX_PATH]
            })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow specifying multiple exclude files', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            configParser.initialize({
                spec: [INDEX_PATH, FIXTURES_CONF],
                exclude: [INDEX_PATH, FIXTURES_CONF]
            })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(0)
        })

        it('should throw if specified exclude file does not exist', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            const hasError = await configParser.initialize({
                exclude: [path.resolve(__dirname, 'foobar.ts')]
            }).then(() => false, () => true)
            expect(hasError).toBe(true)
        })

        it('should allow specifying a glob pattern for exclude', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({ spec: [INDEX_PATH, FIXTURES_CONF] })

            // first validate that the conf fixture 'spec' was merged successfully
            expect(configParser.getSpecs()).toHaveLength(1)

            configParser['merge']({ exclude: [path.join(__dirname, '..', '**', '*conf*').replace(/\\/g, '/')] })

            // then after merging an exclude containing a glob pattern, validate that the exclude
            // attribute contains multiple items and the filtering on the spec attribute works
            expect(configParser.getConfig().exclude.length).toBeGreaterThan(0)
            expect(configParser.getSpecs()).toHaveLength(0)
        })

        it('should overwrite config exclude if piped into cli command', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize()
            // check that the initial exclude from the config filtered out 1 spec (out of a total of 4)
            expect(configParser.getSpecs()).toHaveLength(3)

            configParser['merge']({ exclude: [INDEX_PATH] })
            // after overriding the config exclude with cli exclude check that the initial config exclude is discarded
            expect(configParser.getSpecs()).toHaveLength(4)
        })

        it('should overwrite config and capabilities exclude if piped into cli command', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize()
            expect(configParser.getSpecs()).toHaveLength(3)

            configParser['merge']({ exclude: [FIXTURES_CONF] })
            const specs = configParser.getSpecs([FIXTURES_CONF, FIXTURES_CONF_RDC], [FIXTURES_CONF_RDC])
            expect(specs).toEqual([FIXTURES_CONF_RDC])
        })

        it('should overwrite config and capabilities exclude if piped into cli command with suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            const requireLibPath = path.join(__dirname, 'FileSystemPathService.test.ts')
            const configParserPath = path.join(__dirname, 'configparser.test.ts')

            await configParser.initialize({ suite: ['mobile', 'unit'] })

            // the initial list of specs has the ones defined in the suites passed via cli 'suite' (RequireLibrary & configparser)
            expect(configParser.getSpecs()).toHaveLength(2)

            // set a cli exclude
            configParser['merge']({ exclude: [requireLibPath] })

            // set capability 'specs' and 'exclude'
            const specs = configParser.getSpecs([configParserPath, requireLibPath], [configParserPath])

            // validate that only the cli exclude is taken into account and the 'configparser' test is not removed
            expect(specs).toHaveLength(1)
            expect(specs).toContain(configParserPath)
        })

        it('should overwrite specs w/ wdio:specs files from capabilitoes', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_PREFIX_CONF)
            const prefixedTestFile = path.resolve(FIXTURES_PATH, 'prefix-test-01.ts')
            await configParser.initialize({ 'wdio:specs': [prefixedTestFile] })

            const specs = configParser.getSpecs([prefixedTestFile])
            expect(specs).toContain(prefixedTestFile)
        })

        it('should overwrite exclude w/ wdio:exclude files from capabilities', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_PREFIX_CONF)
            const prefixedTestFile = path.resolve(FIXTURES_PATH, 'prefix-test-01.ts')
            const excludedTestFile = path.resolve(FIXTURES_PATH, 'prefix-test-02.ts')
            await configParser.initialize({ 'wdio:specs': [prefixedTestFile], 'wdio:exclude' : [excludedTestFile] })

            const specs = configParser.getSpecs([prefixedTestFile, excludedTestFile])
            expect(specs).not.toContain(excludedTestFile)
        })

        it('should set hooks to empty arrays as default', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({})

            expect(configParser.getConfig().onPrepare).toHaveLength(0)
            expect(configParser.getConfig().before).toHaveLength(0)
            expect(configParser.getConfig().after).toHaveLength(0)
            expect(configParser.getConfig().onComplete).toHaveLength(0)
        })

        it('should overwrite hooks if provided', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize({
                onPrepare: vi.fn(),
                before: vi.fn(),
                after: vi.fn(),
                onComplete: vi.fn()
            })

            expect(typeof configParser.getConfig().onPrepare).toBe('function')
            expect(typeof configParser.getConfig().before).toBe('function')
            expect(typeof configParser.getConfig().after).toBe('function')
            expect(typeof configParser.getConfig().onComplete).toBe('function')
        })

        it('should overwrite capabilities', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()
            expect(configParser.getCapabilities()).toMatchObject([{ browserName: 'chrome' }])
            configParser['merge']({
                capabilities: [{ browserName: 'safari' }],
            })

            expect(configParser.getCapabilities()).toMatchObject([{ browserName: 'safari' }])
        })
    })

    describe('addService', () => {
        it('should only add functions', async () => {
            const configParser = new ConfigParser(FIXTURES_CONF)
            await configParser.initialize()
            configParser.addService({
                onPrepare: vi.fn(),
                before: undefined,
                // @ts-ignore test invalid param
                beforeTest: 123,
                afterTest: () => 'foobar',
                // @ts-ignore test invalid param
                after: [1, () => 'barfoo', () => 'lala'],
                onComplete: vi.fn()
            })

            expect(configParser['_config'].before).toHaveLength(0)
            expect(configParser['_config'].beforeTest).toHaveLength(0)
            expect(configParser['_config'].afterTest).toHaveLength(1)
            expect(configParser['_config'].after).toHaveLength(2)
            expect(configParser['_config'].onPrepare).toHaveLength(1)
            expect(configParser['_config'].onComplete).toHaveLength(1)
        })
    })

    describe('getCapabilities', () => {
        it('allows to grab certain capabilities', async () => {
            const configParser = new ConfigParser(FIXTURES_CONF)
            await configParser.initialize()
            configParser['_capabilities'] = [
                { browserName: 'foo' },
                { browserName: 'bar' }
            ]
            expect(configParser.getCapabilities()).toEqual(configParser['_capabilities'])
            expect(configParser.getCapabilities(1)).toEqual({ browserName: 'bar' })
        })
    })

    describe('getSpecs', () => {
        it('should exclude files', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize()

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
        })

        it('should exclude files from arrays', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)
            await configParser.initialize()

            const specs = configParser.getSpecs()
            expect(specs[0]).toContain(__filename)
            expect(specs[0]).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
        })

        it('should exclude/include capability excludes', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize()

            const specs = configParser.getSpecs([INDEX_PATH], [__filename])
            expect(specs).not.toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).toContain(INDEX_PATH)
        })

        it('should exclude/include capability excludes in suites', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ suite: ['unit', 'mobile'] })

            const configParserPath = path.join(__dirname, 'configparser.test.ts')
            const requireLibPath = path.join(__dirname, 'FileSystemPathService.test.ts')
            const getSpecs = () => configParser.getSpecs([INDEX_PATH], [requireLibPath])

            // verify that the capability exclude was ignored since
            // config exclude takes precedence over capability exclude
            expect(getSpecs()).toContain(requireLibPath)
            expect(getSpecs()).toContain(configParserPath)

            // verify that the capability exclude is applied successfully
            // when the config exclude is not defined
            configParser['_config'].exclude = []
            expect(getSpecs()).not.toContain(requireLibPath)
            expect(getSpecs()).toContain(configParserPath)
        })

        it('should include typescript files', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()

            const tsFile = path.resolve(FIXTURES_PATH, '*.ts')
            const specs = configParser.getSpecs([tsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'typescript.ts'))
        })

        it('should include es6 files', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()

            const es6File = path.resolve(FIXTURES_PATH, '*.es6')
            const specs = configParser.getSpecs([es6File])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.es6'))
        })

        it('should include mjs files', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()

            const mjsFile = path.resolve(FIXTURES_PATH, '*.mjs')
            const specs = configParser.getSpecs([mjsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.mjs'))
        })

        it('should include cjs files', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()

            const cjsFile = path.resolve(FIXTURES_PATH, '*.cjs')
            const specs = configParser.getSpecs([cjsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.cjs'))
        })

        it('should include files in arrays to be run in a single worker', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)
            await configParser.initialize()

            const specs = configParser.getSpecs()
            expect(Array.isArray(specs[0])).toBe(true)
            // Answer here is 3 because FileSystemPathService.test.ts is not included
            // in MockedFileSystem_LoadingAsMuchAsCanFromFileSystem
            expect(specs[0].length).toBe(3)
        })

        it('should handle grouped specs in suites', async () => {
            // const configParser = await ConfigParserForTest()
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)
            await configParser.initialize({ suite: ['functional'] })

            const specs = configParser.getSpecs()
            expect(specs[0]).not.toContain(path.join(__dirname, '..', 'validateConfig.test.ts'))
            expect(specs[0]).toContain(INDEX_PATH)
            expect(specs[1].length).toBe(3)
        })

        it('should not include other file types', async () => {
            const configParser = await ConfigParserForTest(FIXTURES_CONF)
            await configParser.initialize()

            const javaFile = path.resolve(FIXTURES_PATH, '*.java')
            const specs = configParser.getSpecs([javaFile])
            expect(specs).not.toContain(javaFile)
        })

        it('should include spec when specifying a suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ suite: ['mobile'], spec: [INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
        })

        it('should include spec 3 times with mulit-run', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: [INDEX_PATH], multiRun: 3 })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(3)
            expect(specs).toStrictEqual([
                INDEX_PATH,
                INDEX_PATH,
                INDEX_PATH,
            ])
        })

        it('should not include spec if blank spec parameter passed', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ suite: ['mobile'], spec: [] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
        })

        it('should include specs from suite 3 times with multi-run', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ suite: ['functional'], multiRun: 3 })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(3)
        })

        it('should repeat specs in specific order to fail early', async () => {
            const spec1 = path.resolve(__dirname, '../utils.test.ts')
            const spec2 = path.resolve(__dirname, 'configparser.test.ts')
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ spec: [spec1, spec2], multiRun: 3 })

            const specs = configParser.getSpecs()
            expect(specs).toEqual([
                spec1, spec2,
                spec1, spec2,
                spec1, spec2,
            ])
        })

        it('should throw an error if multi-run is set but no spec or suite is specified', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF)
            await configParser.initialize({ multiRun: 3 })

            expect(() => configParser.getSpecs()).toThrow('The --multi-run flag requires that either the --spec or --suite flag is also set')
        })

        it('should include spec when specifying a suite unless excluded', async () => {
            const configParser = ConfigParserBuilder
                .withBaseDir(
                    path.resolve(__dirname),
                    path.resolve(FIXTURES_PATH, 'sut-config')
                )
                .withFiles([
                    ...(await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem()),
                    FileNamed(path.resolve(FIXTURES_PATH, 'sut-config')).withContents((await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF)).withTheseContentsMergedOn({
                        specs: [path.join(__dirname, '*.test.ts')],
                        config: {
                            exclude: [
                                // FIXTURES_CONF already excludes validateConfig
                                path.resolve(__dirname, 'ganondorf.test.ts')
                            ],
                            suites: {
                                mobile: [
                                    path.resolve(__dirname, 'FileSystemPathService.test.ts'),
                                    path.resolve(__dirname, 'validateConfig.test.ts'),
                                    path.resolve(__dirname, 'link.test.ts'),
                                    path.resolve(__dirname, 'ganondorf.test.ts')
                                ]
                            }
                        }
                    }).build()),
                    FileNamed(path.resolve(__dirname, 'link.test.ts')).withContents(''),
                    FileNamed(path.resolve(__dirname, 'ganondorf.test.ts')).withContents(''),
                    FileNamed(path.resolve(__dirname, 'zelda.test.ts')).withContents('')
                ]).build()

            await configParser.initialize({ suite: ['mobile'], spec: [INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(3)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'FileSystemPathService.test.ts'))
            expect(specs).toContain(path.resolve(__dirname, 'link.test.ts'))
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).not.toContain(path.resolve(__dirname, 'ganondorf.test.ts'))
            expect(specs).not.toContain(path.resolve(__dirname, 'zelda.test.ts'))
        })

        it("should throw if suite doesn't exist or doesn't contain any files", async () => {
            const configParser = ConfigParserBuilder
                .withBaseDir(
                    path.join(process.cwd(), '/workdir/'),
                    'conf-under-test'
                )
                .withFiles(
                    [
                        FileNamed(path.join(process.cwd(), '/workdir/conf-under-test')).withContents({
                            config: {
                                user: 'foobar',
                                key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
                                specs: [path.join(__dirname, '/tests/*.test.ts')],
                                exclude: [
                                    path.join(__dirname, '/tests/and-this-test-two.test.ts')
                                ],
                                capabilities: [{
                                    browserName: 'chrome'
                                }],
                                suites: {
                                    unit: [path.join(__dirname, '/tests/node/configparser.test.ts')],
                                    mobile: [path.join(__dirname, '/tests/node/FileSystemPathService.test.ts')],
                                    functional: [
                                        path.join(__dirname, '/tests/validateConfig.test.ts'),
                                        path.join(__dirname, '/tests/..', 'src/index.ts')
                                    ],
                                    'something': []
                                },
                                suite: ['something']
                            }
                        }),
                        FileNamed(path.join(__dirname, 'tests', 'only-this-test-one.test.ts')).withContents('what1')
                    ]
                ).build()
            await configParser.initialize()
            // eslint-disable-next-line no-useless-escape
            expect(() => configParser.getSpecs()).toThrowError('The suite(s) \"something\" you specified don\'t exist in your config file or doesn\'t contain any files!')
            configParser['merge']({
                suite: ['something-else'],
                spec: [path.join(__dirname, 'tests', 'only-this-test-one.test.ts')]
            })
            // eslint-disable-next-line no-useless-escape
            expect(() => configParser.getSpecs()).toThrowError('The suite(s) \"something\", \"something-else\" you specified don\'t exist in your config file or doesn\'t contain any files!')
        })
    })

    describe('getFilePaths', () => {
        it('should include files in arrays to be run in a single worker', async () => {
            const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)
            await configParser.initialize()

            const filePaths = ConfigParser.getFilePaths(configParser['_config'].specs!, FIXTURES_CONF_ARRAY, configParser['_pathService'])
            expect(Array.isArray(filePaths[0])).toBe(true)
            expect(filePaths[0].length).toBe(4)
            expect(filePaths[0][0]).not.toContain('*')
        })
    })

    it('shard', async () => {
        const configParser = await ConfigParserForTestWithAllFiles(FIXTURES_CONF_ARRAY)

        let specs: any = ['1', '2', '3', '4', '5']
        await configParser.initialize({ shard: { current: 1, total: 3 } })
        expect(configParser.shard(specs)).toEqual(['1', '2'])
        await configParser.initialize({ shard: { current: 2, total: 3 } })
        expect(configParser.shard(specs)).toEqual(['3', '4'])
        await configParser.initialize({ shard: { current: 3, total: 3 } })
        expect(configParser.shard(specs)).toEqual(['5'])

        specs = ['1', ['2.1', '2.2', '2.3'], '3', ['4.1', '4.2']]
        await configParser.initialize({ shard: { current: 1, total: 3 } })
        expect(configParser.shard(specs)).toEqual(['1'])
        await configParser.initialize({ shard: { current: 2, total: 3 } })
        expect(configParser.shard(specs)).toEqual([['2.1', '2.2', '2.3']])
        await configParser.initialize({ shard: { current: 3, total: 3 } })
        expect(configParser.shard(specs)).toEqual(['3', ['4.1', '4.2']])
    })
})
