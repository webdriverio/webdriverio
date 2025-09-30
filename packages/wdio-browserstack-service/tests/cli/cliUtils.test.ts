import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { ZipFile } from 'yauzl'
import yauzl from 'yauzl'
import os from 'node:os'
import * as bstackLogger from '../../src/bstackLogger.js'

import { CLIUtils } from '../../src/cli/cliUtils.js'
import PerformanceTester from '../../src/instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../../src/instrumentation/performance/constants.js'
import type { Options } from '@wdio/types'
import APIUtils from '../../src/cli/apiUtils.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

// vi.mock('../../src/util.js', () => ({
//     isNullOrEmpty: vi.fn()
// }))

describe('CLIUtils', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.restoreAllMocks()
    })

    describe('isDevelopmentEnv', () => {
        it('returns true if env is set to development', async () => {
            process.env.BROWSERSTACK_CLI_ENV = 'development'
            expect(CLIUtils.isDevelopmentEnv()).toBe(true)
        })

        it('returns false if env is not set to development', async () => {
            process.env.BROWSERSTACK_CLI_ENV = 'production'
            expect(CLIUtils.isDevelopmentEnv()).toBe(false)
        })
    })

    describe('getCLIParamsForDevEnv', () => {
        it('returns correct CLI params with environment variable set', () => {
            process.env.BROWSERSTACK_CLI_ENV = 'test'
            const params = CLIUtils.getCLIParamsForDevEnv()
            expect(params).toEqual({
                id: 'test',
                listen: 'unix:/tmp/sdk-platform-test.sock'
            })
        })

        it('returns CLI params with empty id when env not set', () => {
            delete process.env.BROWSERSTACK_CLI_ENV
            const params = CLIUtils.getCLIParamsForDevEnv()
            expect(params).toEqual({
                id: '',
                listen: 'unix:/tmp/sdk-platform-undefined.sock'
            })
        })
    })

    describe('getBinConfig', () => {
        const mockConfig = {
            user: 'testuser',
            key: 'testkey',
            capabilities: {
                'bstack:options': {
                    buildName: 'common-build'
                }
            } as Record <string, unknown>
        } as Options.Testrunner

        it('returns stringified config with basic options', () => {
            const capabilities = [
                { browserName: 'chrome' }
            ]
            const options = {}

            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed).toEqual({
                userName: 'testuser',
                accessKey: 'testkey',
                buildTag: [],
                isNonBstackA11yWDIO: true,
                testContextOptions: {
                    skipSessionName: false,
                    skipSessionStatus: false,
                    sessionNameOmitTestTitle: false,
                    sessionNamePrependTopLevelSuiteTitle: false,
                    sessionNameFormat: ''
                },
                platforms: [{
                    browserName: 'chrome'
                }]
            })
        })

        it('handles array of capabilities', () => {
            const capabilities = [
                { browserName: 'chrome' },
                { browserName: 'firefox' }
            ]
            const options = {}

            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed.platforms).toHaveLength(2)
            expect(parsed.platforms).toEqual([
                { browserName: 'chrome' },
                { browserName: 'firefox' }
            ])
        })

        it('processes bstack:options in capabilities', () => {
            const capabilities = [{
                browserName: 'chrome',
                'bstack:options': {
                    os: 'Windows',
                    osVersion: '10'
                }
            }]
            const options = {}

            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed.platforms[0]).toEqual({
                browserName: 'chrome',
                os: 'Windows',
                osVersion: '10'
            })
        })

        it('converts opts to browserstackLocalOptions in options', () => {
            const capabilities = [
                { browserName: 'chrome' }
            ]
            const options = {
                opts: {
                    localIdentifier: 'test123'
                }
            }

            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed.browserStackLocalOptions).toEqual({
                localIdentifier: 'test123'
            })
            expect(parsed.opts).toBeUndefined()
        })

        it('prioritizes options over capability values', () => {
            const capabilities = {
                browserName: 'chrome',
                browserVersion: '91.0',
                'bstack:options': {
                    buildName: 'cap-build',
                    projectName: 'cap-project'
                }
            }
            const options = {
                testObservabilityOptions: {
                    buildName: 'opt-build',
                    projectName: 'opt-project'
                }
            } as any
            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed.buildName).toBe('opt-build')
            expect(parsed.projectName).toBe('opt-project')
            // Platform capabilities retain their original values from bstack:options
            // expect(parsed.platforms[0].buildName).toBe('cap-build')
            // expect(parsed.platforms[0].projectName).toBe('cap-project')
        })
    })

    describe('getSdkVersion', () => {
        it('returns the bstack service version', () => {
            const version = CLIUtils.getSdkVersion()
            expect(typeof version).toBe('string')
        })
    })

    describe('getSdkLanguage', () => {
        it('returns ECMAScript as sdk language', () => {
            expect(CLIUtils.getSdkLanguage()).toBe('ECMAScript')
        })
    })

    describe('getExistingCliPath', () => {
        const mockCliDir = '/mock/cli/dir'

        beforeEach(() => {
            vi.resetAllMocks()
            vi.spyOn(fs, 'existsSync').mockReturnValue(true)
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
                isFile: () => true,
                mtime: new Date()
            } as fs.Stats)
            vi.spyOn(fs, 'readdirSync').mockReturnValue([])
            vi.spyOn(path, 'basename').mockImplementation((p) => p)
        })

        it('returns empty string when directory does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false)

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
        })

        it('returns empty string when path is not a directory', () => {
            vi.mocked(fs.statSync).mockReturnValue({
                isDirectory: () => false,
                isFile: () => true,
                mtime: new Date()
            } as fs.Stats)

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
        })

        it('returns empty string when no binary files found', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([
                'other-file.txt'
            ] as any)

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
        })

        it('handles filesystem errors', () => {
            vi.mocked(fs.readdirSync).mockImplementation(() => {
                throw new Error('Mock filesystem error')
            })

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
        })
    })

    describe('getTestFrameworkDetail', () => {
        beforeEach(() => {
            // Reset class property and env variable before each test
            CLIUtils.testFrameworkDetail = {}
            delete process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL
        })

        it('returns parsed value from environment variable when set', () => {
            const mockFramework = {
                name: 'mocha',
                version: { mocha: '8.0.0' }
            }
            process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL = JSON.stringify(mockFramework)

            const result = CLIUtils.getTestFrameworkDetail()
            expect(result).toEqual(mockFramework)
        })

        it('returns class property when environment variable is not set', () => {
            const mockFramework = {
                name: 'jest',
                version: { jest: 'latest' }
            }
            CLIUtils.testFrameworkDetail = mockFramework

            const result = CLIUtils.getTestFrameworkDetail()
            expect(result).toEqual(mockFramework)
        })
    })

    describe('getAutomationFrameworkDetail', () => {
        beforeEach(() => {
            // Reset class property and env variable before each test
            CLIUtils.automationFrameworkDetail = {}
            delete process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL
        })

        it('returns parsed value from environment variable when set', () => {
            const mockFramework = {
                name: 'webdriver',
                version: 'latest'
            }
            process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL = JSON.stringify(mockFramework)

            const result = CLIUtils.getAutomationFrameworkDetail()
            expect(result).toEqual(mockFramework)
        })

        it('returns class property when environment variable is not set', () => {
            const mockFramework = {
                name: 'selenium',
                version: '4.0.0'
            }
            CLIUtils.automationFrameworkDetail = mockFramework

            const result = CLIUtils.getAutomationFrameworkDetail()
            expect(result).toEqual(mockFramework)
        })
    })

    describe('setFrameworkDetail', () => {
        it('sets framework details correctly', () => {
            CLIUtils.setFrameworkDetail('mocha', 'webdriver')

            expect(process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL).toBeDefined()
            expect(process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL).toBeDefined()

            const testFramework = JSON.parse(process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL!)
            const autoFramework = JSON.parse(process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL!)

            expect(testFramework).toEqual({
                name: 'mocha',
                version: { mocha: CLIUtils.getSdkVersion() }
            })
            expect(autoFramework).toEqual({
                name: 'webdriver',
                version: { webdriver: CLIUtils.getSdkVersion() }
            })
        })
    })

    describe('checkAndUpdateCli', () => {
        const mockConfig = {} as Options.Testrunner
        const mockCliDir = '/mock/cli/dir'
        const mockExistingPath = '/mock/cli/dir/binary-1.0.0'

        beforeEach(() => {
            // Reset mocks and spies
            vi.resetAllMocks()

            // Mock platform and arch
            vi.spyOn(os, 'platform').mockReturnValue('darwin')
            vi.spyOn(os, 'arch').mockReturnValue('x64')

            // Mock SDK version and language
            vi.spyOn(CLIUtils, 'getSdkVersion').mockReturnValue('1.0.0')
            vi.spyOn(CLIUtils, 'getSdkLanguage').mockReturnValue('wdio')

            // Mock performance tester
            vi.spyOn(PerformanceTester, 'start').mockImplementation(() => {})
            vi.spyOn(PerformanceTester, 'end').mockImplementation(() => {})
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('returns existing path when no update is needed', async () => {
            // Mock shell command and API response
            vi.spyOn(CLIUtils, 'runShellCommand').mockResolvedValue('1.0.0')
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue({})

            const result = await CLIUtils.checkAndUpdateCli(mockExistingPath, mockCliDir, mockConfig)

            expect(result).toBe(mockExistingPath)
            expect(PerformanceTester.start).toHaveBeenCalledWith(PerformanceEvents.SDK_CLI_CHECK_UPDATE)
            expect(PerformanceTester.end).toHaveBeenCalledWith(PerformanceEvents.SDK_CLI_CHECK_UPDATE)
        })

        it('downloads and returns new binary path when update is available', async () => {
            const mockNewBinaryPath = '/mock/cli/dir/binary-2.0.0'
            const mockResponse = {
                updated_cli_version: '2.0.0',
                url: 'https://example.com/binary-2.0.0'
            }

            // Mock required methods
            vi.spyOn(CLIUtils, 'runShellCommand').mockResolvedValue('1.0.0')
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue(mockResponse)
            vi.spyOn(CLIUtils, 'downloadLatestBinary').mockResolvedValue(mockNewBinaryPath)

            const result = await CLIUtils.checkAndUpdateCli(mockExistingPath, mockCliDir, mockConfig)

            expect(result).toBe(mockNewBinaryPath)
            expect(CLIUtils.downloadLatestBinary).toHaveBeenCalledWith(mockResponse.url, mockCliDir)
        })

        it('uses SHELL_EXECUTE_ERROR when runShellCommand fails', async () => {
            vi.spyOn(CLIUtils, 'runShellCommand').mockResolvedValue('SHELL_EXECUTE_ERROR')
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue({})

            const result = await CLIUtils.checkAndUpdateCli(mockExistingPath, mockCliDir, mockConfig)

            expect(result).toBe(mockExistingPath)
            expect(CLIUtils.runShellCommand).toHaveBeenCalled()
            expect(CLIUtils.requestToUpdateCLI).toHaveBeenCalledWith(
                expect.objectContaining({ cli_version: 'SHELL_EXECUTE_ERROR' }),
                mockConfig
            )
        })

        it('uses default cli_version when existing path is empty', async () => {
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue({})

            const result = await CLIUtils.checkAndUpdateCli('', mockCliDir, mockConfig)

            expect(result).toBe('')
            expect(CLIUtils.requestToUpdateCLI).toHaveBeenCalledWith(
                expect.objectContaining({ cli_version: '0' }),
                mockConfig
            )
        })
    })

    describe('setupCliPath', () => {
        const mockConfig = {} as Options.Testrunner

        beforeEach(() => {
            // Reset environment variables and mocks
            delete process.env.SDK_CLI_BIN_PATH
            vi.resetAllMocks()
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('returns development binary path when SDK_CLI_BIN_PATH is set', async () => {
            process.env.SDK_CLI_BIN_PATH = '/custom/path/to/binary'
            const result = await CLIUtils.setupCliPath(mockConfig)
            expect(result).toBe('/custom/path/to/binary')
        })

        it('returns null when getCliDir returns empty string', async () => {
            vi.spyOn(CLIUtils, 'getCliDir').mockReturnValue('')
            const result = await CLIUtils.setupCliPath(mockConfig)
            expect(result).toBeNull()
        })

        it('returns final binary path when setup is successful', async () => {
            const mockCliDir = '/mock/cli/dir'
            const mockExistingPath = '/mock/cli/dir/binary-1.0.0'
            const mockFinalPath = '/mock/cli/dir/binary-2.0.0'

            vi.spyOn(CLIUtils, 'getCliDir').mockReturnValue(mockCliDir)
            vi.spyOn(CLIUtils, 'getExistingCliPath').mockReturnValue(mockExistingPath)
            vi.spyOn(CLIUtils, 'checkAndUpdateCli').mockResolvedValue(mockFinalPath)

            const result = await CLIUtils.setupCliPath(mockConfig)
            expect(result).toBe(mockFinalPath)
        })

        it('returns null when an error occurs during setup', async () => {
            vi.spyOn(CLIUtils, 'getCliDir').mockImplementation(() => {
                throw new Error('Mock error')
            })

            const result = await CLIUtils.setupCliPath(mockConfig)
            expect(result).toBeNull()
        })
    })

    describe('getCurrentInstanceName', () => {
        it('returns string with process id and thread id', () => {
            const instanceName = CLIUtils.getCurrentInstanceName()
            expect(instanceName).toMatch(/^\d+:\d+$/)
        })
    })

    describe('requestToUpdateCLI', () => {
        const mockConfig = {
            user: 'testuser',
            key: 'testkey'
        } as Options.Testrunner

        beforeEach(() => {
            vi.resetAllMocks()

            // Mock fetch to return a mock response
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({ status: 'success' })
            })
        })

        afterEach(() => {
            vi.clearAllMocks()
        })

        it('constructs correct URL with query parameters', async () => {
            const queryParams = {
                param1: 'value1',
                param2: 'value2'
            }

            const mockJsonResponse = { updated_cli_version: '2.0.0' }
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockJsonResponse)
            })

            await CLIUtils.requestToUpdateCLI(queryParams, mockConfig)

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('param1=value1'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Authorization: expect.stringContaining('Basic')
                    })
                })
            )
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('param2=value2'),
                expect.any(Object)
            )
        })

        it('returns response from fetch', async () => {
            const mockResponse = { updated_cli_version: '2.0.0' }
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockResponse)
            })

            const result = await CLIUtils.requestToUpdateCLI({}, mockConfig)

            expect(result).toEqual(mockResponse)
        })

        it('handles errors from fetch', async () => {
            const mockError = new Error('Network error')
            global.fetch = vi.fn().mockRejectedValue(mockError)

            await expect(CLIUtils.requestToUpdateCLI({}, mockConfig))
                .rejects
                .toThrow('Network error')
        })
    })

    describe('runShellCommand', () => {
        it('resolves with stdout for successful command', async () => {
            const result = await CLIUtils.runShellCommand('echo test')
            expect(result).toBe('test')
        })
    })

    describe('downloadFileStream', () => {
        const mockCliDir = '/mock/cli/dir'
        const mockZipFilePath = path.join(mockCliDir, 'downloaded_file.zip')
        let mockWriteStream: fs.WriteStream
        let mockZipFile: ZipFile

        beforeEach(() => {
            vi.resetAllMocks()
            mockWriteStream = {
                on: vi.fn()
            } as unknown as fs.WriteStream

            mockZipFile = {
                readEntry: vi.fn(),
                on: vi.fn(),
                once: vi.fn(),
                close: vi.fn()
            } as unknown as ZipFile

            vi.spyOn(yauzl, 'open').mockImplementation((filePath: string, callback: (err: Error | null, zipfile: ZipFile | null) => void) => {
                callback(null, mockZipFile)
            })
        })

        it('handles zip file errors', async () => {
            const resolve = vi.fn()
            const reject = vi.fn()
            let closeCallback: () => Promise<void> = async () => {}

            vi.spyOn(yauzl, 'open').mockImplementation((filePath: string, callback: (err: Error | null, zipfile: ZipFile | null) => void) => {
                callback(new Error('Zip error'), null)
            })

            mockWriteStream.on = vi.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    closeCallback = callback
                }
            })

            CLIUtils.downloadFileStream(
                mockWriteStream,
                'binary-1.0.0',
                mockZipFilePath,
                mockCliDir,
                resolve,
                reject
            )

            await closeCallback()
            expect(reject).toHaveBeenCalled()
        })
    })

    describe('getCliDir', () => {
        it('returns empty string when writable directory is not available', () => {
            vi.spyOn(CLIUtils, 'getWritableDir').mockReturnValue(null)
            expect(CLIUtils.getCliDir()).toBe('')
        })
    })
})