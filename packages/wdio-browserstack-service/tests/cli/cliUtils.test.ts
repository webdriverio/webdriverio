import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { ZipFile } from 'yauzl'
import yauzl from 'yauzl'
import os from 'node:os'
import * as bstackLogger from '../../src/bstackLogger.js'
import { CLIUtils } from '../../build/cli/cliUtils.js'
import PerformanceTester from '../../src/instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../../src/instrumentation/performance/constants.js'
import type { Options } from '@wdio/types'
import { BStackLogger as logger } from '../../src/cli/cliLogger.js'
import { nodeRequest } from '../../src/util.js'
import { UPDATED_CLI_ENDPOINT, BROWSERSTACK_API_URL } from '../../src/constants.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

vi.mock('../../src/util.js', () => ({
    nodeRequest: vi.fn()
}))

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
            commonCapabilities: {
                'bstack:options': {
                    buildName: 'common-build'
                }
            }
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
                buildName: 'common-build',
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

            expect(parsed.browserstackLocalOptions).toEqual({
                localIdentifier: 'test123'
            })
            expect(parsed.opts).toBeUndefined()
        })

        it('prioritizes options over capability values', () => {
            const capabilities = [{
                browserName: 'chrome',
                'bstack:options': {
                    buildName: 'cap-build'
                }
            }]
            const options = {
                buildName: 'opt-build'
            }

            const result = CLIUtils.getBinConfig(mockConfig, capabilities, options)
            const parsed = JSON.parse(result)

            expect(parsed.buildName).toBe('common-build')
            expect(parsed.platforms[0]).not.toHaveProperty('buildName')
        })
    })

    describe('getSdkVersion', () => {
        it('returns the bstack service version', () => {
            const version = CLIUtils.getSdkVersion()
            expect(typeof version).toBe('string')
        })
    })

    describe('getSdkLanguage', () => {
        it('returns wdio as sdk language', () => {
            expect(CLIUtils.getSdkLanguage()).toBe('wdio')
        })
    })

    describe('getExistingCliPath', () => {
        const mockCliDir = '/mock/cli/dir'

        beforeEach(() => {
            vi.resetAllMocks()
            vi.spyOn(logger, 'error').mockImplementation(() => {})
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
                { name: 'other-file.txt', isFile: () => true, isDirectory: () => false }
            ] as unknown as fs.Dirent[])

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
        })

        it('returns latest binary path based on modified time', () => {
            const oldDate = new Date('2024-01-01')
            const newDate = new Date('2024-01-02')

            vi.mocked(fs.readdirSync).mockReturnValue([
                { name: 'binary-1.0.0', isFile: () => true, isDirectory: () => false },
                { name: 'binary-2.0.0', isFile: () => true, isDirectory: () => false }
            ] as unknown as fs.Dirent[])

            vi.mocked(fs.statSync).mockImplementation((path) => ({
                isDirectory: () => true,
                isFile: () => true,
                mtime: path.toString().includes('2.0.0') ? newDate : oldDate
            } as fs.Stats))

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe(path.join(mockCliDir, 'binary-2.0.0'))
        })

        it('handles filesystem errors', () => {
            vi.mocked(fs.readdirSync).mockImplementation(() => {
                throw new Error('Mock filesystem error')
            })

            const result = CLIUtils.getExistingCliPath(mockCliDir)
            expect(result).toBe('')
            expect(logger.error).toHaveBeenCalled()
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
                version: { mocha: 'latest' }
            })
            expect(autoFramework).toEqual({
                name: 'webdriver',
                version: 'latest'
            })
        })
    })

    describe('setupCliPath', () => {
        const mockConfig = {} as Options.Testrunner

        beforeEach(() => {
            // Reset environment variables and mocks
            delete process.env.SDK_CLI_BIN_PATH
            vi.resetAllMocks()

            // Mock logger to avoid console output during tests
            vi.spyOn(logger, 'debug').mockImplementation(() => {})
            vi.spyOn(logger, 'info').mockImplementation(() => {})
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

            // Mock logger
            vi.spyOn(logger, 'info').mockImplementation(() => {})
            vi.spyOn(logger, 'debug').mockImplementation(() => {})
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

        it('uses default cli_version when existing path is empty', async () => {
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue({})

            await CLIUtils.checkAndUpdateCli('', mockCliDir, mockConfig)

            expect(CLIUtils.requestToUpdateCLI).toHaveBeenCalledWith(
                expect.objectContaining({ cli_version: '0' }),
                mockConfig
            )
            expect(CLIUtils.runShellCommand).not.toHaveBeenCalled()
        })

        it('handles errors during shell command execution', async () => {
            vi.spyOn(CLIUtils, 'runShellCommand').mockRejectedValue(new Error('Command failed'))
            vi.spyOn(CLIUtils, 'requestToUpdateCLI').mockResolvedValue({})

            const result = await CLIUtils.checkAndUpdateCli(mockExistingPath, mockCliDir, mockConfig)

            expect(result).toBe(mockExistingPath)
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
            vi.spyOn(logger, 'debug').mockImplementation(() => {})
        })

        it('makes request with correct parameters and authorization', async () => {
            const queryParams = {
                sdk_version: '1.0.0',
                os: 'darwin',
                cli_version: '2.0.0'
            }
            const expectedAuth = `Basic ${Buffer.from('testuser:testkey').toString('base64')}`

            vi.mocked(nodeRequest).mockResolvedValue({ status: 'success' })

            await CLIUtils.requestToUpdateCLI(queryParams, mockConfig)

            expect(nodeRequest).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining(UPDATED_CLI_ENDPOINT),
                expect.objectContaining({
                    headers: {
                        Authorization: expectedAuth
                    }
                }),
                BROWSERSTACK_API_URL
            )
        })

        it('constructs correct URL with query parameters', async () => {
            const queryParams = {
                param1: 'value1',
                param2: 'value2'
            }

            vi.mocked(nodeRequest).mockResolvedValue({})

            await CLIUtils.requestToUpdateCLI(queryParams, mockConfig)

            expect(nodeRequest).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining('param1=value1'),
                expect.any(Object),
                BROWSERSTACK_API_URL
            )
            expect(nodeRequest).toHaveBeenCalledWith(
                'GET',
                expect.stringContaining('param2=value2'),
                expect.any(Object),
                BROWSERSTACK_API_URL
            )
        })

        it('returns response from nodeRequest', async () => {
            const mockResponse = { updated_cli_version: '2.0.0' }
            vi.mocked(nodeRequest).mockResolvedValue(mockResponse)

            const result = await CLIUtils.requestToUpdateCLI({}, mockConfig)

            expect(result).toEqual(mockResponse)
        })

        it('handles errors from nodeRequest', async () => {
            const mockError = new Error('Network error')
            vi.mocked(nodeRequest).mockRejectedValue(mockError)

            await expect(CLIUtils.requestToUpdateCLI({}, mockConfig))
                .rejects
                .toThrow('Network error')
        })
    })

    describe('runShellCommand', () => {
        it('resolves with stdout for successful command', async () => {
            const result = await CLIUtils.runShellCommand('echo "test"')
            expect(result).toBe('test')
        })

        it('resolves with SHELL_EXECUTE_ERROR for failed command', async () => {
            const result = await CLIUtils.runShellCommand('invalid_command')
            expect(result).toBe('SHELL_EXECUTE_ERROR')
        })
    })

    describe('downloadLatestBinary', () => {
        const mockCliDir = '/mock/cli/dir'
        const mockUrl = 'https://example.com/binary.zip'

        beforeEach(() => {
            vi.resetAllMocks()
            vi.spyOn(PerformanceTester, 'start').mockImplementation(() => {})
            vi.spyOn(PerformanceTester, 'end').mockImplementation(() => {})
            vi.spyOn(logger, 'debug').mockImplementation(() => {})
            vi.spyOn(logger, 'error').mockImplementation(() => {})
            vi.spyOn(path, 'join').mockReturnValue('/mock/cli/dir/downloaded_file.zip')

            // Mock file stream
            vi.spyOn(fs, 'createWriteStream').mockReturnValue({
                on: vi.fn(),
                pipe: vi.fn()
            } as unknown as fs.WriteStream)
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('starts and ends performance testing', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                body: new ReadableStream()
            } as Response)

            await CLIUtils.downloadLatestBinary(mockUrl, mockCliDir)

            expect(PerformanceTester.start).toHaveBeenCalledWith(PerformanceEvents.SDK_CLI_DOWNLOAD)
            expect(PerformanceTester.end).toHaveBeenCalledWith(PerformanceEvents.SDK_CLI_DOWNLOAD)
        })

        it('handles successful download', async () => {
            const mockBody = new ReadableStream()
            vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                body: mockBody
            } as Response)

            vi.spyOn(CLIUtils, 'downloadFileStream').mockImplementation((stream, name, zip, dir, resolve) => {
                resolve('/mock/cli/dir/binary-1.0.0')
            })

            const result = await CLIUtils.downloadLatestBinary(mockUrl, mockCliDir)
            expect(result).toBe('/mock/cli/dir/binary-1.0.0')
        })

        it('handles failed response', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: false,
                status: 404
            } as Response)

            const result = await CLIUtils.downloadLatestBinary(mockUrl, mockCliDir)
            expect(result).toBeNull()
        })

        it('handles network errors', async () => {
            vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

            const result = await CLIUtils.downloadLatestBinary(mockUrl, mockCliDir)
            expect(result).toBeNull()
        })
    })

    describe('downloadFileStream', () => {
        const mockCliDir = '/mock/cli/dir'
        const mockZipFilePath = path.join(mockCliDir, 'downloaded_file.zip')
        let mockWriteStream: fs.WriteStream
        let mockZipFile: ZipFile

        beforeEach(() => {
            vi.resetAllMocks()
            vi.spyOn(logger, 'warn').mockImplementation(() => {})

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

        it('processes zip file entries correctly', async () => {
            const resolve = vi.fn()
            const reject = vi.fn()
            let closeCallback: () => Promise<void> = async () => {}

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
            expect(mockZipFile.readEntry).toHaveBeenCalled()
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
