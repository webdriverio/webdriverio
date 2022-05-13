import path from 'node:path'

import { vi, MockedFunction, describe, it, expect, beforeEach } from 'vitest'
import tsNode from 'ts-node'
import tsConfigPath from 'tsconfig-paths'
// @ts-expect-error
import babelRegister from '@babel/register'
import logger from '@wdio/logger'

import ConfigParser from '../src/lib/ConfigParser'
import MockFileContentBuilder, { MockFileContent } from './lib/MockFileContentBuilder'
import { FilePathsAndContents, MockSystemFilePath, MockSystemFolderPath } from './lib/MockPathService'
import ConfigParserBuilder from './lib/ConfigParserBuilder'
import { FileNamed, realReadFilePair, realRequiredFilePair } from './lib/FileNamed'

const log = logger('')

const FIXTURES_PATH = path.resolve(__dirname, '__fixtures__')
const FIXTURES_CONF = path.resolve(FIXTURES_PATH, 'wdio.conf.ts')
const FIXTURES_CONF_RDC = path.resolve(FIXTURES_PATH, 'wdio.conf.rdc.ts')
const FIXTURES_CONF_ARRAY = path.resolve(FIXTURES_PATH, 'wdio.array.conf.ts')
const FIXTURES_LOCAL_CONF = path.resolve(FIXTURES_PATH, 'wdio.local.conf.ts')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2 = path.resolve(FIXTURES_PATH, 'test-a.feature:2')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12 = path.resolve(FIXTURES_PATH, 'test-a.feature:2:12')
const FIXTURES_CUCUMBER_FEATURE_B_LINE_7 = path.resolve(FIXTURES_PATH, 'test-b.feature:7')
const INDEX_PATH = path.resolve(__dirname, '..', 'src', 'index.ts')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('ts-node', () => ({
    default: { register: vi.fn() }
}))

vi.mock('tsconfig-paths', () => ({
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
const TestWdioConfig_AllInMemory = () : MockFileContent => ({
    config: {
        user: 'foobar',
        key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
        specs: [path.join(__dirname, '/tests/*.test.ts')],
        exclude: [
            path.join(__dirname, '/tests//validateConfig.test.ts')
        ],
        capabilities: [{
            browserName: 'chrome'
        }],
        suites: {
            unit: [path.join(__dirname, '/tests/configparser.test.ts')],
            mobile: [path.join(__dirname, '/tests/RequireLibrary.test.ts')],
            functional: [
                path.join(__dirname, '/tests/validateConfig.test.ts'),
                path.join(__dirname, '/tests/..', 'src/index.ts')
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
        realReadFilePair(path.resolve(FIXTURES_PATH, '../configparser.test.ts')),
        realReadFilePair(path.resolve(FIXTURES_PATH, '../utils.test.ts')),
        realReadFilePair(path.resolve(FIXTURES_PATH, '../RequireLibrary.test.ts')),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.cjs')).withContents('test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.es6')).withContents( 'test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.java')).withContents( 'test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test.mjs')).withContents( 'test file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test-a.feature')).withContents( 'feature file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'test-b.feature')).withContents( 'feature file contents'),
        FileNamed(path.resolve(FIXTURES_PATH, 'typescript.ts')).withContents( 'test file contents'),
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
function MockedFileSystem_OnlyLoadingConfig(baseDir: MockSystemFolderPath, configFilepath: MockSystemFilePath) : FilePathsAndContents {
    return [
        FileNamed(configFilepath).withContents(TestWdioConfig_AllInMemory()),
        FileNamed(path.join(baseDir, '../validateConfig.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../configparser.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../utils.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, '../RequireLibrary.test.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.cjs')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.es6')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.java')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test.mjs')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'test-a.feature')).withContents('feature file contents'),
        FileNamed(path.join(baseDir, 'test-b.feature')).withContents('feature file contents'),
        FileNamed(path.join(baseDir, 'typescript.ts')).withContents('test contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.multiremote.rdc.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.rdc.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.conf.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, 'wdio.local.conf.ts')).withContents('config contents'),
        FileNamed(path.join(baseDir, '../app/src/index.ts')).withContents('source contents')]
}

function ConfigParserForTest(config = FIXTURES_CONF) {
    return ConfigParserBuilder.withBaseDir(FIXTURES_PATH)
        .withFiles(
            MockedFileSystem_OnlyLoadingConfig(FIXTURES_PATH, config)
        ).build()
}

async function ConfigParserForTestWithAllFiles() {
    return ConfigParserBuilder.withBaseDir(FIXTURES_PATH)
        .withFiles(
            await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem()
        ).build()
}

describe('ConfigParser', () => {
    it('should throw if getFilePaths is not a string', () => {
        expect(() => ConfigParser.getFilePaths(123 as any)).toThrow()
    })

    describe('addConfigFile', () => {
        it('should throw if config file is not a string', async () => {
            const configParser = await ConfigParserForTest()
            await expect(() => configParser.addConfigFile(123 as any)).rejects.toThrow()
        })

        it('should throw if config file does not exist (absolute path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser.addConfigFile(path.resolve(__dirname, 'foobar.conf.ts'))).rejects.toThrow()
        })

        it('should throw if config file does not exist (relative path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser.addConfigFile('foobar.conf.ts')).rejects.toThrow()
        })

        it('should throw if config file is not a config file (absolute path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'test-a.feature'))).rejects.toThrow()
        })

        it('should throw if config file is not a config file (relative path)', async () => {
            const configParser = await ConfigParserForTest()
            expect(() => configParser.addConfigFile('test-a.feature')).rejects.toThrow()
        })

        describe('TypeScript integration', () => {
            beforeEach(() => {
                (log.debug as MockedFunction<any>).mockClear()
                ;(tsNode.register as MockedFunction<any>).mockClear()
                ;(tsConfigPath.register as MockedFunction<any>).mockClear()
                process.env.THROW_BABEL_REGISTER = '1'
            })

            it('when ts-node exists should initiate TypeScript compiler with defaults', async function () {
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).build()
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(FIXTURES_PATH, '/here'))
                    .withTsNodeModule(tsNodeRegister)
                    .withFiles([
                        ...(await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem()),
                        FileNamed(path.join(FIXTURES_PATH, '/here/cool.conf')).withContents(configFileContents)
                    ])
                    .build()
                await configParser.addConfigFile('cool.conf')
                await configParser.autoCompile()
                expect(tsNodeRegister).toBeCalledTimes(1)
                expect(tsNodeRegister).toHaveBeenCalledWith( {
                    'transpileOnly': true
                } )
            })

            it('when ts-node exists should initiate TypeScript compiler with defaults if autoCompiled before config is read', async function () {
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).withTheseContentsMergedOn(
                    {
                        config: {
                            autoCompileOpts: {
                                tsNodeOpts: {
                                    'ts-node': 'do this',
                                    'and': 'that'
                                }
                            }
                        }
                    }
                ).build()
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(__dirname, '/tests/'))
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(path.join(__dirname, '/tests/'), '/path/to/config'),
                        FileNamed(path.join(__dirname, '/tests/tests/cool.conf')).withContents(JSON.stringify(configFileContents))
                    ])
                    .withTsNodeModule(tsNodeRegister).build()
                await configParser.autoCompile()
                await configParser.addConfigFile('tests/cool.conf')
                expect(tsNodeRegister).toBeCalledTimes(1)
            })

            it('when ts-node exists should initiate TypeScript compiler with defaults + config, preferring config, if it is present and autocompiled after config is read', async function () {
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).withTheseContentsMergedOn(
                    {
                        config: {
                            autoCompileOpts: {
                                tsNodeOpts: {
                                    'ts-node': 'do this',
                                    'and': 'that'
                                }
                            }
                        }
                    }
                ).build()
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(__dirname, '/tests/'))
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(path.join(__dirname, '/tests/'), '/path/to/config'),
                        FileNamed(path.join(__dirname, '/tests/tests/cool.conf')).withContents(JSON.stringify(configFileContents))
                    ])
                    .withTsNodeModule(tsNodeRegister).build()
                await configParser.addConfigFile('tests/cool.conf')
                await configParser.autoCompile()
                expect(tsNodeRegister).toBeCalledTimes(1)
                expect(tsNodeRegister).toHaveBeenCalledWith( {
                    'transpileOnly': true,
                    'ts-node': 'do this',
                    'and': 'that'
                } )
            })

            it('config can overwrite defaults', async function () {
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).withTheseContentsMergedOn(
                    {
                        config: {
                            autoCompileOpts: {
                                tsNodeOpts: {
                                    'transpileOnly': false
                                }
                            }
                        }
                    }
                ).build()
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(__dirname, '/tests/'))
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(path.join(__dirname, '/tests/'), '/path/to/config'),
                        FileNamed(path.join(__dirname, '/tests/tests/cool.conf')).withContents(JSON.stringify(configFileContents))
                    ])
                    .withTsNodeModule(tsNodeRegister).build()
                await configParser.addConfigFile('tests/cool.conf')
                await configParser.autoCompile()
                expect(tsConfigPath.register).toBeCalledTimes(0)
                expect(tsNodeRegister).toBeCalledTimes(1)
                expect(tsNodeRegister).toHaveBeenCalledWith( {
                    'transpileOnly': false
                } )
            })

            it('bootstraps tsconfig-paths if options are given', async function () {
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).withTheseContentsMergedOn(
                    {
                        config: {
                            autoCompileOpts: {
                                tsConfigPathsOpts: {
                                    base: '/foo/bar'
                                }
                            }
                        }
                    }
                ).build()
                const tsNodeRegister = vi.fn()
                const tsConfigPathRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(path.join(__dirname, '/tests/'))
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(path.join(__dirname, '/tests/'), '/path/to/config'),
                        FileNamed(path.join(__dirname, '/tests/tests/cool.conf')).withContents(JSON.stringify(configFileContents))
                    ])
                    .withTsNodeModule(tsNodeRegister)
                    .withTsconfigPathModule(tsConfigPathRegister)
                    .build()
                await configParser.addConfigFile('tests/cool.conf')
                await configParser.autoCompile()
                expect(tsConfigPathRegister).toHaveBeenCalledWith( {
                    base: '/foo/bar'
                } )
            })

            it('should just continue without initiation when autoCompile:false', async function () {
                (tsNode.register as MockedFunction<any>)
                    .mockImplementation(() => { throw new Error('boom') })
                const tsNodeRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH)
                    .withTsNodeModule(tsNodeRegister)
                    .withFiles(await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem())
                    .build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                configParser.merge({
                    autoCompileOpts: {
                        autoCompile: false
                    }
                })
                await configParser.autoCompile()
                expect(tsNodeRegister).toBeCalledTimes(0)
            })

            it('should just continue without initiation if ts-node does not exist', async () => {
                (tsNode.register as MockedFunction<any>)
                    .mockImplementation(() => { throw new Error('boom') })
                const configParser = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH)
                    .withFiles(await MockedFileSystem_LoadingAsMuchAsCanFromFileSystem())
                    .withNoModules()
                    .build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                await configParser.autoCompile()
                expect(log.debug).toBeCalledTimes(1)
                expect((log.debug as MockedFunction<any>).mock.calls[0][0])
                    .toContain('No compiler found')
            })
        })

        describe('Babel integration', () => {
            beforeEach(() => {
                (log.debug as MockedFunction<any>).mockClear()
                ;(tsNode.register as MockedFunction<any>).mockClear()
                ;(tsNode.register as MockedFunction<any>).mockImplementation(() => {
                    throw new Error('do not exist')
                })

                delete process.env.THROW_BABEL_REGISTER
            })

            it('when @babel/register package exists should initiate with @babel/register compiler', async () => {
                const configContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).build()
                const babelRegister = vi.fn()
                const configParser = ConfigParserBuilder
                    .withBaseDir(
                        FIXTURES_PATH)
                    .withFiles([
                        FileNamed(FIXTURES_CONF_RDC).withContents(configContents)
                    ]
                    )
                    .withBabelModule(babelRegister)
                    .build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                await configParser.autoCompile()

                expect(babelRegister).toHaveBeenCalledWith({})
                expect(log.debug).toBeCalledTimes(1)
                expect((log.debug as MockedFunction<any>).mock.calls[0][0])
                    .toContain('auto-compiling files with Babel')
            })

            it('when @babel/register package exists should merge config, preferring config, if present', async function () {
                delete process.env.THROW_BABEL_REGISTER // Code in this test will bail early if we leave this set
                let configFileContents = (await MockFileContentBuilder.FromRealConfigFile(FIXTURES_CONF_RDC)).withTheseContentsMergedOn(
                    {
                        config: {
                            autoCompileOpts: {
                                babelOpts: {
                                    'babel': 'do this',
                                    'and': 'that'
                                }
                            }
                        }
                    }
                ).build()
                const babelRegister = vi.fn()
                const configParser = ConfigParserBuilder.withBaseDir(path.join(__dirname, '/tests/'))
                    .withFiles([
                        FileNamed(path.join(__dirname, '/tests/cool.conf')).withContents(JSON.stringify(configFileContents)),
                        FileNamed(path.join(__dirname, '/tests//validateConfig.test.ts')).withContents('test contents'),
                        FileNamed(path.join(__dirname, '/tests/validateConfig.test.ts')).withContents('test contents'),
                        FileNamed(path.join(__dirname, '/tests/configparser.test.ts')).withContents('test contents'),
                        FileNamed(path.join(__dirname, '/tests/utils.test.ts')).withContents('test contents'),
                        FileNamed(path.join(__dirname, '/tests/RequireLibrary.test.ts')).withContents('test contents'),
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
                    ])
                    .withBabelModule(babelRegister).build()
                await configParser.addConfigFile(path.join(__dirname, '/tests/cool.conf'))
                await configParser.autoCompile()
                expect(babelRegister).toBeCalledTimes(1)
                expect(babelRegister).toHaveBeenCalledWith( {
                    'babel': 'do this',
                    'and': 'that'
                } )
            })

            it('should just continue without initiation when autoCompile:false', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH)
                    .withBabelModule()
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(process.cwd(), FIXTURES_CONF_RDC)
                    ])
                const { requireMock } = configParserBuilder.getMocks().modules.getMocks()
                const configParser = configParserBuilder.build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                configParser.merge({
                    autoCompileOpts: {
                        autoCompile: false
                    }
                })
                await configParser.autoCompile()
                expect(requireMock).not.toHaveBeenCalled()
            })

            it('should just continue without initiation if @babel/register does not exist', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH)
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(FIXTURES_PATH, FIXTURES_CONF_RDC)
                    ])
                    .withNoModules()
                const { requireMock } = configParserBuilder.getMocks().modules.getMocks()
                const configParser = configParserBuilder.build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                await configParser.autoCompile()
                expect(requireMock).toHaveBeenCalledWith('@babel/register')
                expect(babelRegister).not.toHaveBeenCalled()
                expect(log.debug).toBeCalledTimes(1)
                expect((log.debug as MockedFunction<any>).mock.calls[0][0])
                    .toContain('No compiler found')
            })

            it('when both ts-node and @babel/register exist should prefer ts-node', async () => {
                process.env.THROW_BABEL_REGISTER = '1'
                const configParserBuilder = ConfigParserBuilder
                    .withBaseDir(FIXTURES_PATH)
                    .withFiles([
                        ...MockedFileSystem_OnlyLoadingConfig(FIXTURES_PATH, FIXTURES_CONF_RDC)
                    ])
                    .withTsNodeModule()
                    .withBabelModule()
                const { requireMock } = configParserBuilder.getMocks().modules.getMocks()
                const configParser = configParserBuilder.build()
                await configParser.addConfigFile(FIXTURES_CONF_RDC)
                await configParser.autoCompile()
                expect(requireMock).not.toHaveBeenCalledWith('@babel/register')
                expect(log.debug).toBeCalledTimes(1)
                expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('auto-compiling TypeScript files'))
            })
        })
    })

    describe('merge', () => {
        const isWindows = process.platform === 'win32'
        it('should overwrite specs if piped into cli command', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ specs: [INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying a spec file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should allow specifying a spec file which is Cucumber feature file with line number', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            let featureFileWithoutLine = ''
            if (isWindows){
                featureFileWithoutLine = FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[1]
            } else {
                featureFileWithoutLine = FIXTURES_CUCUMBER_FEATURE_A_LINE_2.split(':')[0]
            }
            expect(specs).toContain(featureFileWithoutLine)
        })

        it('should allow specifying a spec file which is Cucumber feature file with line numbers', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            let featureFileWithoutLine = ''
            if (isWindows){
                featureFileWithoutLine = FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[0] + ':' + FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[1]
            } else {
                featureFileWithoutLine = FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12.split(':')[0]
            }
            expect(specs).toContain(featureFileWithoutLine)
        })

        it('should allow specifying a spec file which is Cucumber feature files with line number', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [FIXTURES_CUCUMBER_FEATURE_A_LINE_2, FIXTURES_CUCUMBER_FEATURE_B_LINE_7] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            let featureFileA = ''
            let featureFileB = ''
            if (isWindows){
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
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : [INDEX_PATH, FIXTURES_CONF] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow to specify partial matching spec file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : ['Library'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
        })

        it('should handle an array in the config_specs', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF_ARRAY)
            configParser.merge({ spec : ['Library'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
        })

        it('should exclude duplicate spec files', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec : [INDEX_PATH, INDEX_PATH] })

            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(INDEX_PATH)
        })

        it('should throw if specified spec file does not exist', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            expect(() => configParser.merge({ spec: [path.resolve(__dirname, 'foobar.ts')] })).toThrow()
        })

        it('should allow to specify multiple suites', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['unit', 'functional', 'mobile'] })

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
        })

        it('should throw when suite is not defined', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['blabla'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla" you specified don't exist/)
        })

        it('should throw when multiple suites are not defined', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['blabla', 'lala'] })
            expect(() => configParser.getSpecs()).toThrow(/The suite\(s\) "blabla", "lala" you specified don't exist/)
        })

        it('should allow to specify a single suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['mobile'] })

            let specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
        })

        it('should not overwrite host and port if specified in host file', async () => {
            const configParser = ConfigParserBuilder.withBaseDir(FIXTURES_PATH)
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
            await configParser.addConfigFile(FIXTURES_LOCAL_CONF)
            configParser.merge({ user: 'barfoo', key: '50fa1411-3121-4gb0-9p07-8q326vvbq7b0' })

            const config = configParser.getConfig()
            expect(config.hostname).toBe('127.0.0.1')
            expect(config.port).toBe(4444)
        })

        it('should allow specifying a exclude file', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH, FIXTURES_CONF] })
            configParser.merge({ exclude: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(1)
            expect(specs).toContain(FIXTURES_CONF)
        })

        it('should allow specifying multiple exclude files', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH, FIXTURES_CONF] })
            configParser.merge({ exclude: [INDEX_PATH, FIXTURES_CONF] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(0)
        })

        it('should throw if specified exclude file does not exist', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            expect(() => configParser.merge({ exclude: [path.resolve(__dirname, 'foobar.ts')] })).toThrow()
        })

        it('should allow specifying a glob pattern for exclude', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ spec: [INDEX_PATH, FIXTURES_CONF] })
            configParser.merge({ exclude: [path.resolve(__dirname).replace(/\\/g, '/') + '/*'] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
        })

        it('should overwrite exclude if piped into cli command', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ exclude: [INDEX_PATH] })
            const specs = configParser.getSpecs()
            expect(specs).toHaveLength(4)
        })

        it('should overwrite exclude if piped into cli command with params', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({})

            const utilsPath = path.join(__dirname, '..', 'src', 'utils.ts')
            const indexPath = path.join(__dirname, '..', 'src', 'index.ts')
            const specs = configParser.getSpecs([indexPath, utilsPath], [utilsPath])
            expect(specs).toEqual([indexPath])
        })

        it('should overwrite exclude if piped into cli command with params in suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['mobile'] })

            const utilsPath = path.join(__dirname, '..', 'src', 'utils.ts')
            const indexPath = path.join(__dirname, '..', 'src', 'index.ts')
            const specs = configParser.getSpecs([indexPath, utilsPath], [utilsPath])
            expect(specs).toEqual([indexPath])
        })

        it('should set hooks to empty arrays as default', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({})

            expect(configParser.getConfig().onPrepare).toHaveLength(0)
            expect(configParser.getConfig().before).toHaveLength(0)
            expect(configParser.getConfig().after).toHaveLength(0)
            expect(configParser.getConfig().onComplete).toHaveLength(0)
        })

        it('should overwrite hooks if provided', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({
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
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)
            expect(configParser.getCapabilities()).toMatchObject([{ browserName: 'chrome' }])
            configParser.merge({
                capabilities: [{ browserName: 'safari' }],
            })

            expect(configParser.getCapabilities()).toMatchObject([{ browserName: 'safari' }])
        })
    })

    describe('addService', () => {
        it('should only add functions', async () => {
            const configParser = new ConfigParser()
            await configParser.addConfigFile(FIXTURES_CONF)
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
        it('allows to grab certain capabilities', () => {
            const configParser = new ConfigParser()
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
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)

            const specs = configParser.getSpecs()
            expect(specs).toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
        })

        it('should exclude files from arrays', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF_ARRAY)

            const specs = configParser.getSpecs()
            expect(specs[0]).toContain(__filename)
            expect(specs[0]).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
        })

        it('should exclude/include capability excludes', async () => {
            // const configParser = await ConfigParserForTest()
            const configParser = await ConfigParserForTestWithAllFiles()

            await configParser.addConfigFile(FIXTURES_CONF)

            const specs = configParser.getSpecs([INDEX_PATH], [__filename])
            expect(specs).not.toContain(__filename)
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).toContain(INDEX_PATH)
        })

        it('should exclude/include capability excludes in suites', async () => {
            // const configParser = await ConfigParserForTest()
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['unit', 'mobile'] })

            const specs = configParser.getSpecs([INDEX_PATH], [path.join(__dirname, 'RequireLibrary.test.ts')])
            expect(specs).not.toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
            expect(specs).toContain(INDEX_PATH)
        })

        it('should include typescript files', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)

            const tsFile = path.resolve(FIXTURES_PATH, '*.ts')
            const specs = configParser.getSpecs([tsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'typescript.ts'))
        })

        it('should include es6 files', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)

            const es6File = path.resolve(FIXTURES_PATH, '*.es6')
            const specs = configParser.getSpecs([es6File])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.es6'))
        })

        it('should include mjs files', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)

            const mjsFile = path.resolve(FIXTURES_PATH, '*.mjs')
            const specs = configParser.getSpecs([mjsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.mjs'))
        })

        it('should include cjs files', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)

            const cjsFile = path.resolve(FIXTURES_PATH, '*.cjs')
            const specs = configParser.getSpecs([cjsFile])
            expect(specs).toContain(path.resolve(FIXTURES_PATH, 'test.cjs'))
        })

        it('should include files in arrays to be run in a single worker', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF_ARRAY)

            const specs = configParser.getSpecs()
            expect(Array.isArray(specs[0])).toBe(true)
            // Answer here is 3 because FileSystemPathService.test.ts is not included
            // in MockedFileSystem_LoadingAsMuchAsCanFromFileSystem
            expect(specs[0].length).toBe(3)
        })

        it('should handle grouped specs in suites', async () => {
            // const configParser = await ConfigParserForTest()
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF_ARRAY)
            configParser.merge({ suite: ['functional'] })

            const specs = configParser.getSpecs()
            expect(specs[0]).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs[0]).toContain(INDEX_PATH)
            expect(specs[1].length).toBe(3)
        })

        it('should not include other file types', async () => {
            const configParser = await ConfigParserForTest()
            await configParser.addConfigFile(FIXTURES_CONF)

            const javaFile = path.resolve(FIXTURES_PATH, '*.java')
            const specs = configParser.getSpecs([javaFile])
            expect(specs).not.toContain(javaFile)
        })

        it('should include spec when specifying a suite', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF)
            configParser.merge({ suite: ['mobile'], spec: [INDEX_PATH] })

            let specs = configParser.getSpecs()
            expect(specs).toHaveLength(2)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
        })

        it('should include spec when specifying a suite unless excluded', async () => {
            const configParser = ConfigParserBuilder
                .withBaseDir(path.resolve(__dirname))
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
                                    path.resolve(__dirname, 'RequireLibrary.test.ts'),
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

            await configParser.addConfigFile(path.resolve(FIXTURES_PATH, 'sut-config'))
            configParser.merge({ suite: ['mobile'], spec: [INDEX_PATH] })

            let specs = configParser.getSpecs()
            expect(specs).toHaveLength(3)
            expect(specs).toContain(INDEX_PATH)
            expect(specs).toContain(path.join(__dirname, 'RequireLibrary.test.ts'))
            expect(specs).toContain(path.resolve(__dirname, 'link.test.ts'))
            expect(specs).not.toContain(path.join(__dirname, 'validateConfig.test.ts'))
            expect(specs).not.toContain(path.resolve(__dirname, 'ganondorf.test.ts'))
            expect(specs).not.toContain(path.resolve(__dirname, 'zelda.test.ts'))
        })

        it("should throw if suite doesn't exist or doesn't contain any files", async () => {
            const configParser = ConfigParserBuilder
                .withBaseDir(path.join(process.cwd(), '/workdir/'))
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
                                    unit: [path.join(__dirname, '/tests/configparser.test.ts')],
                                    mobile: [path.join(__dirname, '/tests/RequireLibrary.test.ts')],
                                    functional: [
                                        path.join(__dirname, '/tests/validateConfig.test.ts'),
                                        path.join(__dirname, '/tests/..', 'src/index.ts')
                                    ],
                                    'something': []
                                },
                                suite: ['something']
                            }
                        }),
                        FileNamed(path.join(__dirname, '/tests/only-this-test-one.test.ts')).withContents('what1')
                    ]
                ).build()
            await configParser.addConfigFile('conf-under-test')
            // eslint-disable-next-line no-useless-escape
            expect(() => configParser.getSpecs()).toThrowError('The suite(s) \"something\" you specified don\'t exist in your config file or doesn\'t contain any files!')
            configParser.merge({ suite: ['something-else'], spec: [path.join(__dirname, '/tests/only-this-test-one.test.ts')] })
            // eslint-disable-next-line no-useless-escape
            expect(() => configParser.getSpecs()).toThrowError('The suite(s) \"something\", \"something-else\" you specified don\'t exist in your config file or doesn\'t contain any files!')
        })
    })

    describe('getFilePaths', () => {
        it('should include files in arrays to be run in a single worker', async () => {
            const configParser = await ConfigParserForTestWithAllFiles()
            await configParser.addConfigFile(FIXTURES_CONF_ARRAY)

            const filePaths = ConfigParser.getFilePaths(configParser['_config'].specs!, undefined, configParser['_pathService'])
            expect(Array.isArray(filePaths[0])).toBe(true)
            expect(filePaths[0].length).toBe(4)
            expect(filePaths[0][0]).not.toContain('*')
        })
    })
})
