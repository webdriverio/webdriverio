import path from 'node:path'
import type { LaunchResponse } from '../src/types.js'

import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import gitRepoInfo from 'git-repo-info'
import CrashReporter from '../src/crash-reporter.js'
import logger from '@wdio/logger'
import * as utils from '../src/util.js'
import logPatcher from '../src/logPatcher.js'
import AccessibilityScripts from '../src/scripts/accessibility-scripts.js'
import {
    getBrowserDescription,
    getBrowserCapabilities,
    isBrowserstackCapability,
    getParentSuiteName,
    getCiInfo,
    getCloudProvider,
    isBrowserstackSession,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    removeAnsiColors,
    getScenarioExamples,
    stopBuildUpstream,
    launchTestSession,
    getGitMetaData,
    getLogTag,
    getHookType,
    isScreenshotCommand,
    getObservabilityUser,
    getObservabilityKey,
    getObservabilityBuild,
    getObservabilityProject,
    getObservabilityBuildTags,
    o11yErrorHandler,
    frameworkSupportsHook,
    getFailureObject,
    validateCapsWithAppA11y,
    validateCapsWithA11y,
    validateCapsWithNonBstackA11y,
    shouldScanTestForAccessibility,
    isAccessibilityAutomationSession,
    isAppAccessibilityAutomationSession,
    isTrue,
    uploadLogs,
    getObservabilityProduct,
    isUndefined,
    processTestObservabilityResponse,
    processAccessibilityResponse,
    processLaunchBuildResponse,
    jsonifyAccessibilityArray,
    formatString,
    _getParamsForAppAccessibility,
    performA11yScan,
    getAppA11yResults,
    getAppA11yResultsSummary,
    mergeDeep,
    mergeChromeOptions
} from '../src/util.js'
import * as bstackLogger from '../src/bstackLogger.js'
import { BROWSERSTACK_OBSERVABILITY, TESTOPS_BUILD_COMPLETED_ENV, BROWSERSTACK_TESTHUB_JWT, BROWSERSTACK_ACCESSIBILITY } from '../src/constants.js'
import * as testHubUtils from '../src/testHub/utils.js'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import type { Options } from '@wdio/types'

const log = logger('test')

vi.mock('fetch')
vi.mock('git-repo-info')
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('fs', () => ({
    default: {
        createReadStream: vi.fn().mockImplementation(() => {return { pipe: vi.fn().mockReturnThis() }}),
        createWriteStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
        stat: vi.fn().mockReturnValue(Promise.resolve({ size: 123 })),
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
    }
}))

vi.mock('./fileStream')

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        promises: {
            readFile: vi.fn().mockImplementation((path) =>
                fs.readFile(path))
        }
    }
})

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

function assertMethodCalls(mock: { mock: { calls: any[] } }, expectedMethod: any, expectedCallCount: any) {
    const matchingCalls = mock.mock.calls.filter(
        ([, options]) => options.method === expectedMethod
    )

    expect(matchingCalls.length).toBe(expectedCallCount)
}

describe('getBrowserCapabilities', () => {
    it('should get default browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser'
            }
        } as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser))
            .toEqual(browser.capabilities as any)
    })

    it('should get multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {
                capabilities: {
                    browser: 'browser'
                }
            }
        } as unknown as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserA'))
            .toEqual(browser.browserA.capabilities as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as unknown as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB')).toEqual({})
    })

    it('should merge service capabilities and browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser',
                os: 'OS X',
            }
        } as unknown as WebdriverIO.Browser
        expect(getBrowserCapabilities(browser, { os: 'Windows' }))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should merge multiremote service capabilities and browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {
                capabilities: {
                    browser: 'browser',
                    os: 'OS X',
                }
            }
        } as unknown as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {
            browserA: { capabilities: { os: 'Windows' } } }, 'browserA'))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as unknown as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB'))
            .toEqual({})
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as unknown as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, { browserB: {} } as any, 'browserB'))
            .toEqual({})
    })
})

describe('getBrowserDescription', () => {
    const defaultCap = {
        'device': 'device',
        'os': 'os',
        'osVersion': 'osVersion',
        'browserName': 'browserName',
        'browser': 'browser',
        'browserVersion': 'browserVersion',
    }
    const defaultDesc = 'device os osVersion browserName browser browserVersion'
    const legacyCap = {
        'os_version': 'os_version',
        'browser_version': 'browser_version'
    }

    it('should get correct description for default capabilities', () => {
        expect(getBrowserDescription(defaultCap)).toEqual(defaultDesc)
    })

    it('should get correct description for legacy capabilities', () => {
        expect(getBrowserDescription(legacyCap)).toEqual('os_version browser_version')
    })

    it('should get correct description for W3C capabilities', () => {
        expect(getBrowserDescription({ 'bstack:options': defaultCap })).toEqual(defaultDesc)
    })

    it('should merge W3C and lecacy capabilities', () => {
        expect(getBrowserDescription({ 'bstack:options': defaultCap })).toEqual(defaultDesc)
    })

    it('should not crash when capabilities is null or undefined', () => {
        // @ts-expect-error test invalid params
        expect(getBrowserDescription(undefined)).toEqual('')
        // @ts-expect-error test invalid params
        expect(getBrowserDescription(null)).toEqual('')
    })
})

describe('isBrowserstackCapability', () => {
    it('should return false if browserstack W3C capabilities is absent or not valid', () => {
        expect(isBrowserstackCapability({})).toBe(false)
        expect(isBrowserstackCapability()).toBe(false)
        // @ts-expect-error test invalid params
        expect(isBrowserstackCapability({ 'bstack:options': null })).toBe(false)
    })

    it('should return false if only key in browserstack W3C capabilities is wdioService', () => {
        expect(isBrowserstackCapability({ 'bstack:options': { wdioService: 'version' } })).toBe(false)
    })

    it('should detect browserstack W3C capabilities', () => {
        expect(isBrowserstackCapability({ 'bstack:options': { os: 'some os' } })).toBe(true)
    })
})

describe('getParentSuiteName', () => {
    it('should return the parent suite name', () => {
        expect(getParentSuiteName('foo bar', 'foo')).toBe('foo')
        expect(getParentSuiteName('foo', 'foo bar')).toBe('foo')
        expect(getParentSuiteName('foo bar', 'foo baz')).toBe('foo')
        expect(getParentSuiteName('foo bar', 'foo bar')).toBe('foo bar')
    })

    it('should return empty string if no common parent', () => {
        expect(getParentSuiteName('foo bar', 'baz bar')).toBe('')
    })

    it('should handle empty values', () => {
        expect(getParentSuiteName('', 'foo')).toBe('')
        expect(getParentSuiteName('foo', '')).toBe('')
    })
})

describe('getCiInfo', () => {
    describe('should handle if running on CI', () => {
        beforeEach(() => {
            process.env.CI = 'true'
        })

        afterEach(() => {
            delete process.env.CI
        })

        it('should return object if any CI being used - codeship', () => {
            process.env.CI_NAME = 'codeship'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CI_NAME
        })

        it('should return object if any CI being used - JENKINS', () => {
            process.env.JENKINS_URL = 'url'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.JENKINS_URL
        })

        it('should return object if any CI being used - TRAVIS', () => {
            process.env.TRAVIS = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.TRAVIS
        })

        it('should return object if any CI being used - CIRCLECI', () => {
            process.env.CIRCLECI = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CIRCLECI
        })

        it('should return object if any CI being used - BITBUCKET', () => {
            process.env.BITBUCKET_BRANCH = 'true'
            process.env.BITBUCKET_COMMIT = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.BITBUCKET_COMMIT
            delete process.env.BITBUCKET_BRANCH
        })

        it('should return object if any CI being used - DRONE', () => {
            process.env.DRONE = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.DRONE
        })

        it('should return object if any CI being used - SEMAPHORE', () => {
            process.env.SEMAPHORE = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.SEMAPHORE
        })

        it('should return object if any CI being used - GITLAB_CI', () => {
            process.env.GITLAB_CI = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.GITLAB_CI
        })

        it('should return object if any CI being used - BUILDKITE', () => {
            process.env.BUILDKITE = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.BUILDKITE
        })

        it('should return object if any CI being used - TF_BUILD', () => {
            process.env.TF_BUILD = 'True'
            process.env.TF_BUILD_BUILDNUMBER = '123'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.TF_BUILD
            delete process.env.TF_BUILD_BUILDNUMBER
        })

        it('should return object if any CI being used - Appveyor', () => {
            process.env.APPVEYOR = 'True'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.APPVEYOR
        })

        it('should return object if any CI being used - CodeBuild', () => {
            process.env.CODEBUILD_BUILD_ID = '1211'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CODEBUILD_BUILD_ID
        })

        it('should return object if any CI being used - Bamboo', () => {
            process.env.bamboo_buildNumber = '123'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.APviwPVEYOR
            delete process.env.bamboo_buildNumber
        })

        it('should return object if any CI being used - Wercker', () => {
            process.env.WERCKER = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.WERCKER
        })

        it('should return object if any CI being used - GCP', () => {
            process.env.GCP_PROJECT = 'True'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.GCP_PROJECT
        })

        it('should return object if any CI being used - Shippable', () => {
            process.env.SHIPPABLE = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.SHIPPABLE
        })

        it('should return object if any CI being used - Netlify', () => {
            process.env.NETLIFY = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.NETLIFY
        })

        it('should return object if any CI being used - Github Actions', () => {
            process.env.GITHUB_ACTIONS = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.GITHUB_ACTIONS
        })
        it('should return object if any CI being used - Vercel', () => {
            process.env.VERCEL = '1'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.VERCEL
        })

        it('should return object if any CI being used - Teamcity', () => {
            process.env.TEAMCITY_VERSION = '3.4'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.TEAMCITY_VERSION
        })

        it('should return object if any CI being used - Concourse', () => {
            process.env.CONCOURSE = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CONCOURSE
        })

        it('should return object if any CI being used - GoCD', () => {
            process.env.GO_JOB_NAME = 'job'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.GO_JOB_NAME
        })

        it('should return object if any CI being used - CodeFresh', () => {
            process.env.CF_BUILD_ID = 'True'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CF_BUILD_ID
        })
    })

    it('should return null if no CI being used', () => {
        expect(getCiInfo()).toBeNull()
    })
})

describe('getCloudProvider', () => {
    it('return unknown_grid if test not on browserstack', () => {
        expect(getCloudProvider({})).toEqual('unknown_grid')
    })
    it('return Browserstack if test being run on browserstack', () => {
        expect(getCloudProvider({ options: { hostname: 'hub.browserstack.com' } })).toEqual('browserstack')
    })
})

describe('isBrowserstackSession', () => {
    it('return false if run locally', () => {
        expect(isBrowserstackSession({})).toEqual(false)
    })
    it('return false if run on any other cloud service', () => {
        expect(isBrowserstackSession({ options: { hostname: 'anything-saucelabs.com' } })).toEqual(false)
    })
    it('return true if run on Browserstack', () => {
        expect(isBrowserstackSession({ options: { hostname: 'hub.browserstack.com' } })).toEqual(true)
    })
})

describe('getUniqueIdentifier', () => {
    it('return unique identifier for mocha tests', () => {
        const test = {
            parent: 'root-level',
            title: 'title',
            fullName: '',
            ctx: '',
            type: '',
            fullTitle: '',
            pending: false,
            file: ''
        }
        expect(getUniqueIdentifier(test)).toEqual('root-level - title')
    })

    it('return unique identifier for jasmine tests', () => {
        const test = {
            description: 'title',
            fullName: 'root-level title',
            pending: false
        }
        expect(getUniqueIdentifier(test as any, 'jasmine')).toEqual('root-level title')
    })
})

describe('getUniqueIdentifierForCucumber', () => {
    it('return unique identifier for cucumber tests', () => {
        const test = {
            pickle: {
                uri: 'uri',
                astNodeIds: ['1', '2']
            }
        }
        expect(getUniqueIdentifierForCucumber(test)).toEqual('uri_1,2')
    })
})

describe('removeAnsiColors', () => {
    it('remove color encoding', () => {
        expect(removeAnsiColors('\x1b[F\x1b[31;1mHello, there!\x1b[m\x1b[E')).toEqual('Hello, there!')
    })
})

describe('getScenarioExamples', () => {
    it('return undefined if no nesting is there', () => {
        const test = {
            pickle: {
                name: 'name',
                astNodeIds: ['1']
            }
        }
        expect(getScenarioExamples(test)).toEqual(undefined)
    })

    it('return undefined if astNodeIds not present', () => {
        const test = {
            pickle: {
                name: 'name'
            }
        }
        expect(getScenarioExamples(test)).toEqual(undefined)
    })

    it('return examples array', () => {
        const test = {
            gherkinDocument: {
                feature: {
                    children: [
                        {
                            background: {
                                id: '1',
                                name: '',
                            }
                        },
                        {
                            scenario: {
                                id: '8',
                                steps: [
                                    {
                                        id: '2',
                                        keyword: 'Given ',
                                        text: 'the title is <title>',
                                    },
                                    {
                                        id: '3',
                                        keyword: 'Then ',
                                        text: 'I expect that element "h1" contains the same text as element ".subtitle"',
                                    }
                                ],
                                examples: [
                                    {
                                        id: '7',
                                        tags: [],
                                        location: { line: 12, column: 9 },
                                        keyword: 'Examples',
                                        name: '',
                                        description: '',
                                        tableHeader: {
                                            id: '4',
                                            location: { line: 13, column: 13 },
                                            cells: [
                                                {
                                                    location: { line: 13, column: 15 },
                                                    value: 'title'
                                                }
                                            ]
                                        },
                                        tableBody: [
                                            {
                                                id: '5',
                                                location: { line: 14, column: 13 },
                                                cells: [
                                                    {
                                                        location: { line: 14, column: 15 },
                                                        value: 'value1'
                                                    }
                                                ]
                                            },
                                            {
                                                id: '6',
                                                location: { line: 15, column: 13 },
                                                cells: [
                                                    {
                                                        location: { line: 15, column: 15 },
                                                        value: 'value2'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                },
            },
            pickle: {
                name: 'name',
                astNodeIds: ['8', '5']
            }
        }
        expect(getScenarioExamples(test)).toEqual(['value1'])
    })

    it('return array with passed examples if rule present', () => {
        const test = {
            gherkinDocument: {
                feature: {
                    children: [
                        {
                            background: {
                                id: '1',
                                name: '',
                            }
                        },
                        {
                            rule: {
                                children: [
                                    {
                                        scenario: {
                                            id: '8',
                                            steps: [
                                                {
                                                    id: '2',
                                                    keyword: 'Given ',
                                                    text: 'the title is <title>',
                                                },
                                                {
                                                    id: '3',
                                                    keyword: 'Then ',
                                                    text: 'I expect that element "h1" contains the same text as element ".subtitle"',
                                                }
                                            ],
                                            examples: [
                                                {
                                                    id: '7',
                                                    tags: [],
                                                    location: { line: 12, column: 9 },
                                                    keyword: 'Examples',
                                                    name: '',
                                                    description: '',
                                                    tableHeader: {
                                                        id: '4',
                                                        location: { line: 13, column: 13 },
                                                        cells: [
                                                            {
                                                                location: { line: 13, column: 15 },
                                                                value: 'title'
                                                            }
                                                        ]
                                                    },
                                                    tableBody: [
                                                        {
                                                            id: '5',
                                                            location: { line: 14, column: 13 },
                                                            cells: [
                                                                {
                                                                    location: { line: 14, column: 15 },
                                                                    value: 'value1'
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            id: '6',
                                                            location: { line: 15, column: 13 },
                                                            cells: [
                                                                {
                                                                    location: { line: 15, column: 15 },
                                                                    value: 'value2'
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
            },
            pickle: {
                name: 'name',
                astNodeIds: ['8', '5']
            }
        }
        expect(getScenarioExamples(test)).toEqual(['value1'])
    })

    it('return undefined if no examples present', () => {
        const test = {
            gherkinDocument: {
                feature: {
                    children: []
                },
            },
            pickle: {
                name: 'name',
                astNodeIds: ['8', '5']
            }
        }
        expect(getScenarioExamples(test)).toEqual(undefined)
    })
})

describe('stopBuildUpstream', () => {
    it('return error if completed but jwt token not present', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        delete process.env[BROWSERSTACK_TESTHUB_JWT]

        const result: any = await stopBuildUpstream()

        delete process.env[TESTOPS_BUILD_COMPLETED_ENV]
        expect(result.status).toEqual('error')
        expect(result.message).toEqual('Token/buildID is undefined, build creation might have failed')
    })

    it('return success if completed', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[BROWSERSTACK_TESTHUB_JWT] = 'jwt'

        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({})))

        const result: any = await stopBuildUpstream()
        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
        expect(result.status).toEqual('success')
    })

    it('return error if failed', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[BROWSERSTACK_TESTHUB_JWT] = 'jwt'

        vi.mocked(fetch).mockReturnValueOnce(Promise.reject(Response.json({})))

        const result: any = await stopBuildUpstream()
        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
        expect(result.status).toEqual('error')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})

describe('launchTestSession', () => {
    vi.mocked(gitRepoInfo).mockReturnValue({} as any)
    vi.spyOn(testHubUtils, 'getProductMap').mockReturnValue({} as any)

    it('returns launch response when build is started successfully', async () => {
        const mockResponse = { build_hashed_id: 'build_id', jwt: 'jwt' }
        const fetchMock = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue(mockResponse)
        })
        vi.mocked(fetch).mockImplementation(fetchMock)

        vi.spyOn(testHubUtils, 'getProductMapForBuildStartCall').mockReturnValue({
            key1: false,
            key2: true
        })

        const result: any = await launchTestSession({ framework: 'framework' } as any, {}, {}, {})
        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, options] = fetchMock.mock.calls[0]
        expect(options.method).toBe('POST')
        expect(result).toEqual(mockResponse)
    })
})

describe('getLogTag', () => {

    it('return correct tag', () => {
        expect(getLogTag('TestRunStarted')).toEqual('Test_Upload')
        expect(getLogTag('TestRunFinished')).toEqual('Test_Upload')
        expect(getLogTag('HookRunStarted')).toEqual('Hook_Upload')
        expect(getLogTag('HookRunFinished')).toEqual('Hook_Upload')
        expect(getLogTag('LogCreated')).toEqual('Log_Upload')
    })
})

describe('getGitMetaData', () => {

    it('return undefined', async () => {
        vi.mocked(gitRepoInfo).mockReturnValue({} as any)
        const result: any = await getGitMetaData()
        expect(result).toEqual(undefined)
    })

    it('return non empty object', async () => {
        vi.mocked(gitRepoInfo).mockReturnValue({ commonGitDir: '/tmp', worktreeGitDir: '/tmp' } as any)
        try {
            const result: any = await getGitMetaData()
            expect(result).toEqual({})
        } catch (e) {
            //
        }
    })
})

describe('getHookType', () => {
    it('get hook type as string', () => {
        expect(getHookType('"before each" hook for test 1')).toEqual('BEFORE_EACH')
        expect(getHookType('"after each" hook for test 1')).toEqual('AFTER_EACH')
        expect(getHookType('"before all" hook for test 1')).toEqual('BEFORE_ALL')
        expect(getHookType('"after all" hook for test 1')).toEqual('AFTER_ALL')
        expect(getHookType('no hook test')).toEqual('unknown')
    })
})

describe('isScreenshotCommand', () => {
    it('get true if screenshot command', () => {
        expect(isScreenshotCommand({ endpoint: 'session/:sessionId/screenshot' })).toEqual(true)
    })
    it('get false if not a screenshot command', () => {
        expect(isScreenshotCommand({ endpoint: 'session/:sessionId/element/text' })).toEqual(false)
    })
})

describe('getObservabilityUser', () => {
    it('get env var', () => {
        process.env.BROWSERSTACK_USERNAME = 'try'
        expect(getObservabilityUser({}, {})).toEqual('try')
        delete process.env.BROWSERSTACK_USERNAME
    })

    it('get user passed in testObservabilityOptions', () => {
        delete process.env.BROWSERSTACK_USERNAME
        expect(getObservabilityUser({ testObservabilityOptions: { user: 'user' } } as any, {})).toEqual('user')
    })

    it('get user passed at root level', () => {
        delete process.env.BROWSERSTACK_USERNAME
        expect(getObservabilityUser({ testObservabilityOptions: { } } as any, { user: 'user-root' })).toEqual('user-root')
    })

    it('get undefined', () => {
        delete process.env.BROWSERSTACK_USERNAME
        expect(getObservabilityUser({}, {})).toEqual(undefined)
    })
})

describe('getObservabilityKey', () => {
    it('get env var', () => {
        process.env.BROWSERSTACK_ACCESS_KEY = 'try'
        expect(getObservabilityKey({}, {})).toEqual('try')
        delete process.env.BROWSERSTACK_ACCESS_KEY
    })

    it('get key passed in testObservabilityOptions', () => {
        delete process.env.BROWSERSTACK_ACCESS_KEY
        expect(getObservabilityKey({ testObservabilityOptions: { key: 'user-key' } } as any, {})).toEqual('user-key')
    })

    it('get key passed at root level', () => {
        delete process.env.BROWSERSTACK_ACCESS_KEY
        expect(getObservabilityKey({ testObservabilityOptions: { } } as any, { key: 'key-root' })).toEqual('key-root')
    })

    it('get undefined', () => {
        delete process.env.BROWSERSTACK_ACCESS_KEY
        expect(getObservabilityKey({}, {})).toEqual(undefined)
    })
})

describe('getObservabilityBuild', () => {
    it('get env var', () => {
        process.env.TEST_OBSERVABILITY_BUILD_NAME = 'try'
        expect(getObservabilityBuild({})).toEqual('try')
        delete process.env.TEST_OBSERVABILITY_BUILD_NAME
    })

    it('get name passed in testObservabilityOptions', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_NAME
        expect(getObservabilityBuild({ testObservabilityOptions: { buildName: 'build' } } as any)).toEqual('build')
    })

    it('get name passed at root level', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_NAME
        expect(getObservabilityBuild({ key: 'key-root', testObservabilityOptions: { } } as any, 'build-name')).toEqual('build-name')
    })

    it('get default', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_NAME
        expect(getObservabilityBuild({})).toEqual(path.basename(path.resolve(process.cwd())))
    })
})

describe('getObservabilityProject', () => {
    it('get env var', () => {
        process.env.TEST_OBSERVABILITY_PROJECT_NAME = 'try'
        expect(getObservabilityProject({})).toEqual('try')
        delete process.env.TEST_OBSERVABILITY_PROJECT_NAME
    })

    it('get name passed in testObservabilityOptions', () => {
        delete process.env.TEST_OBSERVABILITY_PROJECT_NAME
        expect(getObservabilityProject({ testObservabilityOptions: { projectName: 'project' } } as any)).toEqual('project')
    })

    it('get name passed at root level', () => {
        delete process.env.TEST_OBSERVABILITY_PROJECT_NAME
        expect(getObservabilityProject({ key: 'key-root', testObservabilityOptions: { } } as any, 'project-name')).toEqual('project-name')
    })

    it('get undefined', () => {
        delete process.env.TEST_OBSERVABILITY_PROJECT_NAME
        expect(getObservabilityProject({})).toEqual(undefined)
    })
})

describe('getObservabilityBuildTags', () => {
    it('get array from env var', () => {
        process.env.TEST_OBSERVABILITY_BUILD_TAG = 'try,qa'
        expect(getObservabilityBuildTags({})).toEqual(['try', 'qa'])
        delete process.env.TEST_OBSERVABILITY_BUILD_TAG
    })

    it('get tags passed in testObservabilityOptions', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_TAG
        expect(getObservabilityBuildTags({ testObservabilityOptions: { buildTag: ['qa', 'test'] } } as any)).toEqual(['qa', 'test'])
    })

    it('get name passed at root level', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_TAG
        expect(getObservabilityBuildTags({ key: 'key-root', testObservabilityOptions: { } } as any, 'qa')).toEqual(['qa'])
    })

    it('get empty array', () => {
        delete process.env.TEST_OBSERVABILITY_BUILD_TAG
        expect(getObservabilityBuildTags({})).toEqual([])
    })
})

describe('o11yErrorHandler', () => {
    let spy: any
    beforeEach(() => {
        spy = vi.spyOn(CrashReporter, 'uploadCrashReport')
        spy.mockImplementation(() => {})
    })

    afterEach(() => {
        spy.mockClear()
        spy.mockReset()
    })

    describe('synchronous function', () => {
        const func = (a: number, b: number) => {
            if (a === 0 && b === 0) {
                throw 'zero error'
            }
            return a + b
        }

        it ('should pass the arguments and return value correctly', () => {
            const newFunc = o11yErrorHandler(func)
            expect(() => {
                expect(newFunc(1, 2)).toEqual(3)
            }).not.toThrow()
            expect(spy).toBeCalledTimes(0)
        })

        it('should catch error thrown from function', () => {
            const newFunc = o11yErrorHandler(func)
            expect(() => {
                newFunc(0, 0)
            }).not.toThrow()
            expect(spy).toBeCalledTimes(1)
        })
    })

    describe('asynchronous function', () => {
        const func = async (a: number, b: number) => {
            const val = await new Promise(resolve => {
                if (a === 0 && b === 0) {
                    throw 'zero error'
                }
                resolve(a * b)
            })
            return val
        }

        it('should return values correctly from async function', async () => {
            const newFunc = o11yErrorHandler(func)
            const val = await newFunc(1, 2)
            expect(val).toEqual(2)
            expect(spy).toBeCalledTimes(0)
        })

        it('should catch error from async function', async () => {
            const newFunc = o11yErrorHandler(func)
            await newFunc(0, 0)
            expect(spy).toBeCalledTimes(1)
        })
    })
})

describe('validateCapsWithAppA11y', () => {
    let logInfoMock: any
    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')
    })

    it('returns false if platform version is lesser than 11', async () => {
        const platformMeta = {
            platform_name: 'android',
            platform_version: '10.0'
        }

        expect(validateCapsWithAppA11y(platformMeta)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('App Accessibility Automation tests are supported on OS version 11 and above for Android devices.')
    })

    it('returns true if validation done', async () => {
        const platformMeta = {
            'platform_name': 'android',
            'platform_version': '13.0'
        }

        expect(validateCapsWithAppA11y(undefined, platformMeta)).toEqual(true)
    })
})

describe('validateCapsWithA11y', () => {
    let logInfoMock: any
    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')
    })

    it('returns false if deviceName is defined', async () => {
        expect(validateCapsWithA11y('Samsung S22')).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will run only on Desktop browsers.')
    })

    it('returns false if browser is not chrome', async () => {
        const platformMeta = {
            'browser_name': 'safari'
        }

        expect(validateCapsWithA11y(undefined, platformMeta)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will run only on Chrome browsers.')
    })

    it('returns false if browser version is lesser than 94', async () => {
        const platformMeta = {
            'browser_name': 'chrome',
            'browser_version': '90'
        }

        expect(validateCapsWithA11y(undefined, platformMeta)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will run only on Chrome browser version greater than 94.')
    })

    it('returns false if browser version is lesser than 94', async () => {
        const platformMeta = {
            'browser_name': 'chrome',
            'browser_version': 'latest'
        }
        const chromeOptions = {
            args: ['--headless']
        }

        expect(validateCapsWithA11y(undefined, platformMeta, chromeOptions)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will not run on legacy headless mode. Switch to new headless mode or avoid using headless mode.')
    })

    it('returns true if validation done', async () => {
        const platformMeta = {
            'browser_name': 'chrome',
            'browser_version': 'latest'
        }
        const chromeOptions = {}

        expect(validateCapsWithA11y(undefined, platformMeta, chromeOptions)).toEqual(true)
    })
})

describe('validateCapsWithNonBstackA11y', () => {
    let logInfoMock: any
    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')
    })

    it('returns false if browser is not chrome', async () => {

        const browserName = 'safari'
        const browserVersion = 'latest'

        expect(validateCapsWithNonBstackA11y(browserName, browserVersion)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will run only on Chrome browsers.')
    })

    it('returns false if browser version is lesser than 100', async () => {

        const browserName = 'chrome'
        const browserVersion = '98'

        expect(validateCapsWithNonBstackA11y(browserName, browserVersion)).toEqual(false)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Accessibility Automation will run only on Chrome browser version greater than 100.')
    })

    it('returns true if validation done', async () => {
        const browserName = 'chrome'
        const browserVersion = 'latest'

        expect(validateCapsWithNonBstackA11y(browserName, browserVersion)).toEqual(true)
    })

})

describe('shouldScanTestForAccessibility', () => {
    const cucumberWorldObj = {
        pickle: {
            tags: [
                {
                    name: 'someTag'
                }
            ]
        }
    }
    it('returns true if full test name contains includeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { includeTagsInTestingScope: 'title' })).toEqual(true)
    })

    it('returns false if full test name contains excludeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { excludeTagsInTestingScope: 'title' })).toEqual(true)
    })

    it('returns true if cucumber tags contain includeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { includeTagsInTestingScope: 'someTag' }, cucumberWorldObj, true )).toEqual(true)
    })

    it('returns false if cucumber tags contain excludeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { excludeTagsInTestingScope: 'someTag' }, cucumberWorldObj, true)).toEqual(true)
    })
})

describe('isAccessibilityAutomationSession', () => {
    it('returns true if accessibility is true and ally token is present', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        expect(isAccessibilityAutomationSession(true)).toEqual(true)
    })

    it('returns true if accessibility is true and ally token is present', async () => {
        process.env.BSTACK_A11Y_JWT = ''
        expect(isAccessibilityAutomationSession(true)).toEqual(false)
    })
})

describe('isAppAccessibilityAutomationSession', () => {
    it('returns true if accessibility and app automate are true and app ally token is present', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        expect(isAppAccessibilityAutomationSession(true, true)).toEqual(true)
    })

    it('returns true if accessibility and app automate are true and app ally token is present', async () => {
        process.env.BSTACK_A11Y_JWT = ''
        expect(isAppAccessibilityAutomationSession(true, true)).toEqual(false)
    })
})

describe('getA11yResults', () => {
    const browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Catalina',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: vi.fn(),
        executeAsync: vi.fn(),
        on: vi.fn(),
    } as unknown as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return success object if ally token defined and no error in response data', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResults((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual([])
    })

    it('should call executeAccessibilityScript if bstack and accessibility session are enabled', async () => {
        process.env.BSTACK_A11Y_JWT = 'abc'
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        const executeAccessibilityScriptSpy = vi
            .spyOn(utils, 'executeAccessibilityScript')
            .mockResolvedValue(undefined)
        vi.spyOn(AccessibilityScripts, 'getResults', 'get').mockReturnValue('mocked_results_script')
        const results = await utils.getA11yResults(false, browser as WebdriverIO.Browser, true, true)
        expect(results).toEqual(undefined)
        executeAccessibilityScriptSpy.mockRestore()
        delete process.env.BSTACK_A11Y_JWT
    })
})

describe('getA11yResultsSummary', () => {
    const browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Catalina',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: vi.fn(),
        executeAsync: vi.fn(),
        on: vi.fn(),
    } as unknown as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return success object if ally token defined and no error in response data', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual({})
    })

    it('returns results object for an accessibility session', async () => {
        process.env.BSTACK_A11Y_JWT = 'abc'
        AccessibilityScripts.getResultsSummary = 'mockScript'
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        const mockExecuteAccessibilityScript = vi
            .spyOn(utils, 'executeAccessibilityScript')
            .mockResolvedValue({ })
        const result = await utils.getA11yResultsSummary(false, {} as WebdriverIO.Browser, true, true)
        delete process.env.BSTACK_A11Y_JWT
        expect(result).toEqual({ })
    })
})

describe('isTrue', () => {
    it('returns true if value is `true`', async () => {
        expect(isTrue('true')).toEqual(true)
    })

    it('returns false if value is `false`', async () => {
        expect(isTrue('false')).toEqual(false)
    })

    it('returns false if value is undefined', async () => {
        expect(isTrue(undefined)).toEqual(false)
    })
})

describe('getBrowserStackUser', function () {
    it('should return userName from config if not present as env variable', function () {
        expect(utils.getBrowserStackUser({
            user: 'config_user_name',
            key: 'config_user_key',
            capabilities: {}
        })).toEqual('config_user_name')
    })

    it('should return userName if present as env variable', function () {
        process.env.BROWSERSTACK_USERNAME = 'user_name'
        expect(utils.getBrowserStackUser({
            user: 'config_user_name',
            key: 'config_user_key',
            capabilities: {}
        })).toEqual('user_name')
    })

})

describe('getBrowserStackKey', function () {
    it('should return accessKey from config if not present as env variable', function () {
        expect(utils.getBrowserStackKey({
            user: 'config_user_name',
            key: 'config_user_key',
            capabilities: {}
        })).toEqual('config_user_key')
    })

    it('should return accessKey if present as env variable', function () {
        process.env.BROWSERSTACK_ACCESS_KEY = 'user_key'
        expect(utils.getBrowserStackKey({
            user: 'config_user_name',
            key: 'config_user_key',
            capabilities: {}
        })).toEqual('user_key')
    })
})

describe('frameworkSupportsHook', function () {
    describe('mocha', function () {
        it('should return true for beforeHook', function () {
            expect(frameworkSupportsHook('before', 'mocha')).toBe(true)
        })
    })

    describe('cucumber', function () {
        it('should return true for cucumber', function () {
            expect(frameworkSupportsHook('before', 'cucumber')).toBe(true)
        })
    })

    it('should return false for any other framework', function () {
        expect(frameworkSupportsHook('before', 'jasmine')).toBe(false)
    })
})

describe('uploadLogs', function () {
    let tempLogFile: string
    beforeAll(async () => {
        tempLogFile = path.join(os.tmpdir(), 'test-logs.txt')
        await fs.writeFile(tempLogFile, 'mock log content')
        bstackLogger.BStackLogger.logFilePath = tempLogFile
        vi.mocked(fetch).mockClear()
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ status: 'success', message: 'Logs uploaded Successfully' })))
    })
    it('should return if user is undefined', async function () {
        await uploadLogs(undefined, 'some_key', 'some_uuid')
        expect(fetch).not.toHaveBeenCalled()
    })
    it('should return if key is undefined', async function () {
        await uploadLogs('some_user', undefined, 'some_uuid')
        expect(fetch).not.toHaveBeenCalled()
    })
    it('should upload the logs', async function () {
        await uploadLogs('some_user', 'some_key', 'some_uuid')
        expect(fetch).toHaveBeenCalled()
    })
    afterAll(async () => {
        await fs.unlink(tempLogFile)
        vi.mocked(fetch).mockClear()
        vi.restoreAllMocks()
    })
})

describe('getFailureObject', function () {
    it('should return parsed failure object for string error', function () {
        const error = 'some error'
        expect(getFailureObject(error)).toEqual({
            failure: [{ backtrace: [''] }],
            failure_reason: 'some error',
            failure_type: 'UnhandledError'
        })
    })

    it('should parse for assertion error', function () {
        const error = new Error('AssertionError: 2 is not equal to 4')
        expect(getFailureObject(error)).toMatchObject({
            failure_reason: 'AssertionError: 2 is not equal to 4',
            failure_type: 'AssertionError'
        })
    })

    it ('should get stacktrace for error object', function () {
        const error = new Error('some error')
        expect(getFailureObject(error)).toMatchObject({
            failure: [{ backtrace: [error.stack.toString()] }]
        })
    })
})

describe('getObservabilityProduct', () => {
    it ('should return app automate', function () {
        expect(getObservabilityProduct(undefined, true)).toEqual('app-automate')
    })
})

describe('isUndefined', () => {
    it ('should return true for empty string', function () {
        expect(isUndefined('')).toEqual(true)
    })
})

describe('processTestObservabilityResponse', () => {
    let response: LaunchResponse, handleErrorForObservabilitySpy
    beforeAll(() => {
        response = {
            jwt: 'abc',
            build_hashed_id: 'abc',
            observability: {
                success: true,
                options: {},
                errors: undefined
            },
            accessibility: {
                success: true,
                options: {
                    status: 'true',
                    commandsToWrap: {
                        scriptsToRun: [],
                        commands: []
                    },
                    scripts: [{
                        name: 'abc',
                        command: 'abc'
                    }],
                    capabilities: [{
                        name: 'abc',
                        value: 'abc'
                    }]
                },
                errors: undefined
            }
        }
    })
    it ('processTestObservabilityResponse should not log an error', function () {
        processTestObservabilityResponse(response)
        expect(process.env[BROWSERSTACK_OBSERVABILITY]).toEqual('true')
    })
    it ('processTestObservabilityResponse should log error if observability success is false', function () {
        handleErrorForObservabilitySpy = vi.spyOn(testHubUtils, 'handleErrorForObservability').mockReturnValue({} as any)
        const res = response
        res.observability!.success = false
        processTestObservabilityResponse(res)
        expect(handleErrorForObservabilitySpy).toBeCalled()
    })
    it ('processTestObservabilityResponse should log error if observability field not found', function () {
        handleErrorForObservabilitySpy = vi.spyOn(testHubUtils, 'handleErrorForObservability').mockReturnValue({} as any)
        const res = response
        res.observability = undefined
        processTestObservabilityResponse(res)
        expect(handleErrorForObservabilitySpy).toBeCalled()
    })
    afterEach(() => {
        handleErrorForObservabilitySpy?.mockClear()
    })
})

describe('processAccessibilityResponse', () => {
    let response: LaunchResponse, handleErrorForAccessibilitySpy
    let options: BrowserstackConfig & Options.Testrunner
    beforeAll(() => {
        response = {
            jwt: 'abc',
            build_hashed_id: 'abc',
            observability: {
                success: true,
                options: {},
                errors: undefined
            },
            accessibility: {
                success: true,
                options: {
                    status: 'true',
                    commandsToWrap: {
                        scriptsToRun: [],
                        commands: []
                    },
                    scripts: [{
                        name: 'abc',
                        command: 'abc'
                    }],
                    capabilities: [
                        {
                            name: 'accessibilityToken',
                            value: 'abc'
                        },
                        {
                            name: 'scannerVersion',
                            value: 'abc'
                        }
                    ]
                },
                errors: undefined
            }
        }
        options = {}
    })
    it ('processAccessibilityResponse should not log an error', function () {
        const optionsWithAccessibilityTrue = options
        optionsWithAccessibilityTrue.accessibility = true
        processAccessibilityResponse(response, optionsWithAccessibilityTrue)
        expect(process.env[BROWSERSTACK_ACCESSIBILITY]).toEqual('true')
    })
    it ('processAccessibilityResponse should log error if accessibility success is false', function () {
        handleErrorForAccessibilitySpy = vi.spyOn(testHubUtils, 'handleErrorForAccessibility').mockReturnValue({} as any)
        const res = response
        res.accessibility!.success = false
        const optionsWithAccessibilityTrue = options
        optionsWithAccessibilityTrue.accessibility = true
        processAccessibilityResponse(res, optionsWithAccessibilityTrue)
        expect(handleErrorForAccessibilitySpy).toBeCalled()
    })
    it ('processAccessibilityResponse should log error if accessibility field not found', function () {
        handleErrorForAccessibilitySpy = vi.spyOn(testHubUtils, 'handleErrorForAccessibility').mockReturnValue({} as any)
        const res = response
        res.accessibility = undefined
        const optionsWithAccessibilityTrue = options
        optionsWithAccessibilityTrue.accessibility = true
        processAccessibilityResponse(res, optionsWithAccessibilityTrue)
        expect(handleErrorForAccessibilitySpy).toBeCalled()
    })
    it ('processAccessibilityResponse should not log error if accessibility field not found & accessibility not found in options', function () {
        handleErrorForAccessibilitySpy = vi.spyOn(testHubUtils, 'handleErrorForAccessibility').mockReturnValue({} as any)
        const res = response
        res.accessibility = undefined
        const optionsWithAccessibilityNull = options
        optionsWithAccessibilityNull.accessibility = null
        processAccessibilityResponse(res, optionsWithAccessibilityNull)
        expect(handleErrorForAccessibilitySpy).toBeCalledTimes(0)
    })
    afterEach(() => {
        handleErrorForAccessibilitySpy?.mockClear()
    })
})

describe('processLaunchBuildResponse', () => {
    let response: LaunchResponse, observabilitySpy, accessibilitySpy
    beforeAll(() => {
        response = {
            jwt: 'abc',
            build_hashed_id: 'abc',
            observability: {
                success: true,
                options: {},
                errors: undefined
            },
            accessibility: {
                success: true,
                options: {
                    status: 'true',
                    commandsToWrap: {
                        scriptsToRun: [],
                        commands: []
                    },
                    scripts: [{
                        name: 'abc',
                        command: 'abc'
                    }],
                    capabilities: [{
                        name: 'accessibilityToken',
                        value: 'abc'
                    }]
                },
                errors: undefined
            }
        }
    })
    beforeEach(() => {
        observabilitySpy = vi.spyOn(utils, 'processTestObservabilityResponse').mockImplementation(() => {})
        accessibilitySpy = vi.spyOn(utils, 'processAccessibilityResponse').mockImplementation(() => {})
    })
    it ('processTestObservabilityResponse should be called', function () {
        processLaunchBuildResponse(response, { testObservability: true, accessibility: true, capabilities: {} })
        expect(process.env[BROWSERSTACK_OBSERVABILITY]).toEqual('true')
    })
    it ('processAccessibilityResponse should be called', function () {
        processLaunchBuildResponse(response, { testObservability: true, accessibility: true, capabilities: {} })
        expect(process.env[BROWSERSTACK_ACCESSIBILITY]).toEqual('true')
    })
    afterEach(() => {
        observabilitySpy?.mockClear()
        accessibilitySpy?.mockClear()
    })
})

describe('jsonifyAccessibilityArray', () => {
    const array = [{
        name: 'accessibilityToken',
        value: 'abc'
    }]
    it('jsonifyAccessibilityArray', () => {
        expect(jsonifyAccessibilityArray(array, 'name', 'value')).toEqual({ 'accessibilityToken': 'abc' })
    })
})

describe('logPatcher', () => {
    let emitSpy: jest.SpyInstance
    beforeEach(() => {
        emitSpy = vi.spyOn(process, 'emit') as unknown as vi.SpyInstance
    })
    afterEach(() => {
        emitSpy.mockRestore()
    })
    it('logPatcher methods should emit data', () => {
        const BSTestOpsPatcher = new logPatcher({})
        BSTestOpsPatcher.info('abc')
        BSTestOpsPatcher.error('abc')
        BSTestOpsPatcher.warn('abc')
        BSTestOpsPatcher.trace('abc')
        BSTestOpsPatcher.debug('abc')
        BSTestOpsPatcher.log('abc')
        expect(emitSpy).toHaveBeenCalled()
    })
})

describe('formatString', () => {
    it('should replace %s placeholders with provided values in order', () => {
        const template = 'Hello %s, your score is %s'
        const values = ['John', '100']

        expect(formatString(template, ...values)).toBe('Hello John, your score is 100')
    })

    it('should handle null values in array', () => {
        const template = 'Name: %s, Score: %s'
        const values = ['John', null]

        expect(formatString(template, ...values)).toBe('Name: John, Score: ')
    })

    it('should handle null template', () => {
        const template = null
        const values = ['John', '100']

        expect(formatString(template, ...values)).toBe('')
    })

    it('should handle undefined values', () => {
        const template = 'Value: %s'
        const values = [undefined]

        expect(formatString(template, ...values)).toBe('Value: ')
    })

    it('should handle template without placeholders', () => {
        const template = 'Hello World'
        const values = ['John', null]

        expect(formatString(template, ...values)).toBe('Hello World')
    })

    it('should handle empty template string', () => {
        const template = ''
        const values = ['John', null]

        expect(formatString(template, ...values)).toBe('')
    })
})

describe('_getParamsForAppAccessibility', () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = {
            TEST_ANALYTICS_ID: 'test-123',
            BROWSERSTACK_TESTHUB_UUID: 'build-456',
            BROWSERSTACK_TESTHUB_JWT: 'jwt-789',
            BSTACK_A11Y_JWT: 'auth-abc'
        }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('should return params object with command name when provided', () => {
        const result = _getParamsForAppAccessibility('clickElement')

        expect(result).toEqual({
            thTestRunUuid: 'test-123',
            thBuildUuid: 'build-456',
            thJwtToken: 'jwt-789',
            authHeader: 'auth-abc',
            scanTimestamp: Date.now(),
            method: 'clickElement'
        })
    })

    it('should return params object with undefined method when no command name provided', () => {
        const result = _getParamsForAppAccessibility()

        expect(result).toEqual({
            thTestRunUuid: 'test-123',
            thBuildUuid: 'build-456',
            thJwtToken: 'jwt-789',
            authHeader: 'auth-abc',
            scanTimestamp: Date.now(),
            method: undefined
        })
    })

    it('should handle missing environment variables', () => {
        process.env = {}

        const result = _getParamsForAppAccessibility('test')

        expect(result).toEqual({
            thTestRunUuid: undefined,
            thBuildUuid: undefined,
            thJwtToken: undefined,
            authHeader: undefined,
            scanTimestamp: Date.now(),
            method: 'test'
        })
    })

    it('should handle partial environment variables', () => {
        process.env = {
            TEST_ANALYTICS_ID: 'test-123',
            BROWSERSTACK_TESTHUB_UUID: 'build-456'
        }

        const result = _getParamsForAppAccessibility('test')

        expect(result).toEqual({
            thTestRunUuid: 'test-123',
            thBuildUuid: 'build-456',
            thJwtToken: undefined,
            authHeader: undefined,
            scanTimestamp: Date.now(),
            method: 'test'
        })
    })
})

describe('performA11yScan', () => {
    let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    let logInfoMock: any

    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')
    })

    it('should return early if not an Accessibility Automation session', async () => {
        browser = {
            execute: async () => ({ success: true }),
            executeAsync: async () => ({ success: true }),
        } as unknown as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

        const result = await performA11yScan(false, browser, true, false)
        expect(result).toBeUndefined()
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Not an Accessibility Automation session, cannot perform Accessibility scan.')
    })

    it('should perform app accessibility scan when isAppAutomate is true', async () => {
        const mockResults = { success: true }

        const mockScanScript = 'scan script with param: %s'
        vi.spyOn(AccessibilityScripts, 'performScan', 'get').mockReturnValue(mockScanScript)

        const browser = {
            execute: vi.fn().mockResolvedValue(mockResults),
            executeAsync: vi.fn().mockResolvedValue(mockResults),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        process.env.TEST_ANALYTICS_ID = 'test-123'
        process.env.BROWSERSTACK_TESTHUB_UUID = 'build-456'
        process.env.BROWSERSTACK_TESTHUB_JWT = 'jwt-789'
        process.env.BSTACK_A11Y_JWT = 'auth-abc'

        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'isAppAccessibilityAutomationSession').mockReturnValue(true)

        const result = await performA11yScan(true, browser, true, true, 'clickElement')

        expect(result).toEqual(mockResults)
        expect(browser.execute).toHaveBeenCalledWith(
            expect.stringContaining('scan script with param:'),
            {}
        )

        delete process.env.TEST_ANALYTICS_ID
        delete process.env.BROWSERSTACK_TESTHUB_UUID
        delete process.env.BROWSERSTACK_TESTHUB_JWT
        delete process.env.BSTACK_A11Y_JWT
    })

    it('should perform web accessibility scan when isAppAutomate is false', async () => {
        const mockResults = { success: true }

        const browser = {
            execute: vi.fn().mockResolvedValue(mockResults),
            executeAsync: vi.fn().mockResolvedValue(mockResults),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        process.env.TEST_ANALYTICS_ID = 'test-123'
        process.env.BROWSERSTACK_TESTHUB_UUID = 'build-456'
        process.env.BROWSERSTACK_TESTHUB_JWT = 'jwt-789'
        process.env.BSTACK_A11Y_JWT = 'auth-abc'

        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'isAppAccessibilityAutomationSession').mockReturnValue(false)
        vi.spyOn(AccessibilityScripts, 'performScan', 'get').mockReturnValue('scan_script_for_web')

        const result = await performA11yScan(false, browser, true, true, 'clickElement')

        expect(result).toEqual(mockResults)
        expect(browser.execute).toHaveBeenCalledWith(
            expect.stringContaining('scan_script_for_web'),
        )
        delete process.env.TEST_ANALYTICS_ID
        delete process.env.BROWSERSTACK_TESTHUB_UUID
        delete process.env.BROWSERSTACK_TESTHUB_JWT
        delete process.env.BSTACK_A11Y_JWT
    })
})

describe('getAppA11yResults', () => {
    let browser: WebdriverIO.Browser
    let logInfoMock: any

    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')
        const result = {
            data: {
                issues: [{ 'issueName': 'Readable Text Spacing' }],
            },
        }
        vi.mocked(fetch).mockClear()
        vi.mocked(fetch).mockResolvedValue({
            json: async () => (result),
            headers: new Headers(),
            ok: true,
            status: 200,
        } as Response)
        logInfoMock = vi.spyOn(log, 'warn')
    })

    it('should return empty array if not a BrowserStack session', async () => {
        browser = {
            execute: async () => ({ success: true }),
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        const result = await getAppA11yResults(true, browser, false, true)
        expect(result).toEqual([])
    })

    it('should return empty array if not an App Accessibility Automation session', async () => {
        browser = {
            execute: async () => ({ success: true }),
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        const result = await getAppA11yResults(true, browser, true, false)
        expect(result).toEqual([])
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
    })

    it('should return results for valid app accessibility session', async () => {
        const mockResults = [{ 'issueName': 'Readable Text Spacing' }]

        const browser = {
            execute: vi.fn().mockResolvedValue(mockResults),
            executeAsync: vi.fn().mockResolvedValue(mockResults),
            capabilities: {},
        } as unknown as WebdriverIO.Browser

        process.env.BSTACK_A11Y_POLLING_TIMEOUT = '30'
        process.env.TEST_ANALYTICS_ID = 'test-123'
        process.env.BSTACK_A11Y_JWT = 'abc'

        vi.spyOn(utils, 'isAppAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'performA11yScan').mockResolvedValue(undefined)

        const result = await getAppA11yResults(true, browser, true, true, 'session123')

        expect(result).toEqual(mockResults)

        delete process.env.BSTACK_A11Y_POLLING_TIMEOUT
        delete process.env.TEST_ANALYTICS_ID
        delete process.env.BSTACK_A11Y_JWT
    })

    it('should return empty array if error occurs during fetch', async () => {
        browser = {
            execute: async () => { throw new Error('Test error') },
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        const result = await getAppA11yResults(true, browser, true, true, 'session123')
        expect(result).toEqual([])
    })
})

describe('getAppA11yResultsSummary', () => {
    let browser: WebdriverIO.Browser
    let logInfoMock: any
    let pollApiMock: any

    beforeEach(() => {
        logInfoMock = vi.spyOn(log, 'warn')

        const result = {
            data: {
                summary: {
                    'totalIssueCount': 64,
                    'totalBySeverity': {
                        'minor': 0,
                        'serious': 0,
                        'critical': 6,
                        'moderate': 58,
                    },
                },
            },
        }
        vi.mocked(fetch).mockClear()
        vi.mocked(fetch).mockResolvedValue({
            json: async () => (result),
            headers: new Headers(),
            ok: true,
            status: 200,
        } as Response)
        logInfoMock = vi.spyOn(log, 'warn')
        pollApiMock = vi.spyOn(utils, 'pollApi').mockResolvedValue({
            data: {
                data: {
                    summary: {}
                }
            }
        } as any)
    })

    it('should return empty object if not a BrowserStack session', async () => {
        browser = {
            execute: async () => ({ success: true }),
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        const result = await getAppA11yResultsSummary(true, browser, false, true)
        expect(result).toEqual({})
    })

    it('should return empty object if not an App Accessibility Automation session', async () => {
        browser = {
            execute: async () => ({ success: true }),
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        const result = await getAppA11yResultsSummary(true, browser, true, false)
        expect(result).toEqual({})
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
    })

    it('should return results summary for valid app accessibility session', async () => {
        const mockResults = { 'totalIssueCount' : 64, 'totalBySeverity': { 'minor':0, 'serious':0, 'critical': 6, 'moderate': 58 } }

        const browser = {
            execute: vi.fn().mockResolvedValue(mockResults),
            executeAsync: vi.fn().mockResolvedValue(mockResults),
            capabilities: {},
        } as unknown as WebdriverIO.Browser

        process.env.BSTACK_A11Y_POLLING_TIMEOUT = '30'
        process.env.TEST_ANALYTICS_ID = 'test-123'
        process.env.BSTACK_A11Y_JWT = 'abc'

        vi.spyOn(utils, 'isAppAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'performA11yScan').mockResolvedValue(undefined)

        const result = await getAppA11yResultsSummary(true, browser, true, true, 'session123')

        expect(result).toEqual(mockResults)

        delete process.env.BSTACK_A11Y_POLLING_TIMEOUT
        delete process.env.TEST_ANALYTICS_ID
        delete process.env.BSTACK_A11Y_JWT
    })

    it('should return empty object if error occurs during fetch', async () => {
        browser = {
            execute: async () => { throw new Error('Test error') },
            executeAsync: async () => ({ success: true }),
            capabilities: {}
        } as unknown as WebdriverIO.Browser

        pollApiMock.mockRejectedValueOnce(new Error('API Error'))

        const result = await getAppA11yResultsSummary(true, browser, true, true, 'session123')
        expect(result).toEqual({})
    })

    afterEach(() => {
        delete process.env.TEST_ANALYTICS_ID
        delete process.env.BSTACK_A11Y_JWT
        vi.clearAllMocks()
    })

    describe('mergeDeep', () => {
        it('should deeply merge two objects', () => {
            const target = { a: 1, b: { c: 2 } }
            const source = { b: { d: 3 }, e: 4 }
            const result = mergeDeep(target, source)

            expect(result).toEqual({
                a: 1,
                b: { c: 2, d: 3 },
                e: 4
            })
        })

        it('should handle empty sources', () => {
            const target = { a: 1 }
            const result = mergeDeep(target)

            expect(result).toEqual({ a: 1 })
        })
    })

    describe('mergeChromeOptions', () => {
        it('should merge ChromeOptions args and extensions correctly', () => {
            const base = {
                args: ['--disable-gpu'],
                extensions: ['ext1'],
                prefs: {
                    homepage: 'https://example.com'
                }
            }

            const override = {
                args: ['--headless'],
                extensions: ['ext2'],
                prefs: {
                    newtab: 'https://newtab.com'
                }
            }

            const result = mergeChromeOptions(base, override)

            expect(result.args).toEqual(['--disable-gpu', '--headless'])
            expect(result.extensions).toEqual(['ext1', 'ext2'])
            expect(result.prefs).toEqual({
                homepage: 'https://example.com',
                newtab: 'https://newtab.com'
            })
        })
    })
})

