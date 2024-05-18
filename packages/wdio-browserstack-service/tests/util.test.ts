import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import gitRepoInfo from 'git-repo-info'
import CrashReporter from '../src/crash-reporter.js'
import logger from '@wdio/logger'
import * as utils from '../src/util.js'
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
    validateCapsWithA11y,
    shouldScanTestForAccessibility,
    isAccessibilityAutomationSession,
    createAccessibilityTestRun,
    isTrue,
    uploadLogs
} from '../src/util.js'
import * as bstackLogger from '../src/bstackLogger.js'
import { TESTOPS_BUILD_COMPLETED_ENV, TESTOPS_JWT_ENV } from '../src/constants.js'

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
        } as any as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserA'))
            .toEqual(browser.browserA.capabilities as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as any as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB')).toEqual({})
    })

    it('should merge service capabilities and browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser',
                os: 'OS X',
            }
        } as any as WebdriverIO.Browser
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
        } as any as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {
            browserA: { capabilities: { os: 'Windows' } } }, 'browserA'))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as any as WebdriverIO.MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB'))
            .toEqual({})
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            browserA: {}
        } as any as WebdriverIO.MultiRemoteBrowser
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
        expect(getCiInfo()).toBeNull
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
        delete process.env[TESTOPS_JWT_ENV]

        const result: any = await stopBuildUpstream()

        delete process.env[TESTOPS_BUILD_COMPLETED_ENV]
        expect(result.status).toEqual('error')
        expect(result.message).toEqual('Token/buildID is undefined, build creation might have failed')
    })

    it('return success if completed', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'

        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({})))

        const result: any = await stopBuildUpstream()
        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
        expect(result.status).toEqual('success')
    })

    it('return error if failed', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'

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

    it('return undefined if completed', async () => {

        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ build_hashed_id: 'build_id', jwt: 'jwt' })))

        const result: any = await launchTestSession( { framework: 'framework' } as any, { }, {})
        assertMethodCalls(vi.mocked(fetch), 'POST', 1)
        expect(result).toEqual(undefined)
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

describe('createAccessibilityTestRun', () => {
    const logInfoMock = vi.spyOn(log, 'error')

    beforeEach (() => {
        vi.mocked(logInfoMock).mockClear()
        vi.mocked(gitRepoInfo).mockReturnValue({} as any)
    })

    it('return null if BrowserStack credentials are undefined', async () => {
        const result = await createAccessibilityTestRun( { framework: 'framework' } as any, {})
        expect(result).toEqual(null)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Exception while creating test run for BrowserStack Accessibility Automation: Missing BrowserStack credentials')
    })

    it('return undefined if completed', async () => {
        vi.spyOn(utils, 'getGitMetaData').mockReturnValue({} as any)
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ data: { accessibilityToken: 'someToken', id: 'id', scannerVersion: '0.0.6.0' } })))

        const result = await createAccessibilityTestRun( { framework: 'framework' } as any, { user: 'user', key: 'key' }, {})
        expect(fetch).toBeCalledTimes(1)
        expect(result).toEqual('0.0.6.0')
    })

    it('return undefined if completed', async () => {
        vi.spyOn(utils, 'getGitMetaData').mockReturnValue({} as any)
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ accessibilityToken: 'someToken', id: 'id', scannerVersion: '0.0.6.0' })))

        const result: any = await createAccessibilityTestRun( { framework: 'framework' } as any, { user: 'user', key: 'key' }, { bstackServiceVersion: '1.2.3' })
        expect(fetch).toBeCalledTimes(1)
        expect(result).toEqual(null)
        expect(logInfoMock.mock.calls[0][0]).contains('Exception while creating test run for BrowserStack Accessibility Automation')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})

describe('stopAccessibilityTestRun', () => {
    beforeEach (() => {
        vi.mocked(gitRepoInfo).mockReturnValue({} as any)
    })

    it('return error object if ally token not defined', async () => {
        process.env.BSTACK_A11Y_JWT = undefined
        const result: any = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': 'Build creation had failed.', 'status': 'error' })
    })

    it('return success object if ally token defined and no error in response data', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ data: {} })))
        const result: any = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': '', 'status': 'success' })
    })

    it('return error object if ally token defined and no error in response data', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ data: { error: 'Some Error occurred' } })))
        const result = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': 'Invalid request: Some Error occurred', 'status': 'error' })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
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
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return false if BrowserStack Session', async () => {
        const result: any = await utils.getA11yResults((browser as WebdriverIO.Browser), false, false)
        expect(result).toEqual([])
    })

    it('return success object if ally token defined and no error in response data', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResults((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual([])
    })

    it('return results object if bstack as well as accessibility session', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        await utils.getA11yResults((browser as WebdriverIO.Browser), true, true)
        expect(browser.executeAsync).toBeCalledTimes(2)
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
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return false if BrowserStack Session', async () => {
        const result: any = await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), false, false)
        expect(result).toEqual({})
    })

    it('return success object if ally token defined and no error in response data', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual({})
    })

    it('return results object if bstack as well as accessibility session', async () => {
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), true, true)
        expect(browser.executeAsync).toBeCalledTimes(2)
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
    beforeAll(() => {
        vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ status: 'success', message: 'Logs uploaded Successfully' })))
    })
    it('should return if user is undefined', async function () {
        await uploadLogs(undefined, 'some_key', 'some_uuid')
        expect(fetch).not.toHaveBeenCalled()
        vi.mocked(fetch).mockClear()
    })
    it('should return if key is undefined', async function () {
        await uploadLogs('some_user', undefined, 'some_uuid')
        expect(fetch).not.toHaveBeenCalled()
        vi.mocked(fetch).mockClear()
    })
    it('should upload the logs', async function () {
        await uploadLogs('some_user', 'some_key', 'some_uuid')
        expect(fetch).toHaveBeenCalled()
        vi.mocked(fetch).mockClear()
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
