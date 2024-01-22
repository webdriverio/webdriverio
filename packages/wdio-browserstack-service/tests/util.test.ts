import gitRepoInfo from 'git-repo-info'
import got from 'got'
import path from 'path'
import logger from '@wdio/logger'
import * as utils from '../src/util'

import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import CrashReporter from '../src/crash-reporter'

import {
    batchAndPostEvents,
    getBrowserCapabilities,
    getBrowserDescription,
    getCiInfo,
    getCloudProvider,
    getGitMetaData,
    getHierarchy,
    getHookType,
    getLogTag,
    getObservabilityBuild,
    getObservabilityBuildTags,
    getObservabilityKey,
    getObservabilityProject,
    getObservabilityUser,
    getParentSuiteName,
    getScenarioExamples,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    isBrowserstackCapability,
    isBrowserstackSession,
    isScreenshotCommand,
    launchTestSession,
    o11yErrorHandler,
    removeAnsiColors,
    shouldAddServiceVersion,
    stopBuildUpstream,
    uploadEventData,
    validateCapsWithA11y,
    shouldScanTestForAccessibility,
    isAccessibilityAutomationSession,
    createAccessibilityTestRun,
    isTrue,
    frameworkSupportsHook,
    getFailureObject
} from '../src/util'

const log = logger('test')

jest.mock('got')
jest.mock('git-repo-info')
jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
// jest.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getBrowserCapabilities', () => {
    it('should get default browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser'
            }
        } as Browser
        expect(getBrowserCapabilities(browser))
            .toEqual(browser.capabilities as any)
    })

    it('should get multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {
                capabilities: {
                    browser: 'browser'
                }
            }
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserA'))
            .toEqual(browser.browserA.capabilities as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB')).toEqual({})
    })

    it('should merge service capabilities and browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser',
                os: 'OS X',
            }
        } as any as Browser
        expect(getBrowserCapabilities(browser, { os: 'Windows' }))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should merge multiremote service capabilities and browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {
                capabilities: {
                    browser: 'browser',
                    os: 'OS X',
                }
            }
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, { browserA: { capabilities: { os: 'Windows' } } }, 'browserA'))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB'))
            .toEqual({})
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
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
            // process.env.CI_NAME = 'codeship'
        })

        afterEach(() => {
            delete process.env.CI
            // delete process.env.CI_NAME
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

        it('should return object if any CI being used - Azure', () => {
            process.env.AZURE_HTTP_USER_AGENT = 'Agent'
            process.env.TF_BUILD = 'True'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.AZURE_HTTP_USER_AGENT
            delete process.env.TF_BUILD
        })

        it('should return object if any CI being used - CodeBuild', () => {
            process.env.CODEBUILD_BUILD_ID = '1211'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.CODEBUILD_BUILD_ID
        })

        it('should return object if any CI being used - Bamboo', () => {
            process.env.bamboo_buildNumber = '123'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.bamboo_buildNumber
        })

        it('should return object if any CI being used - Wercker', () => {
            process.env.WERCKER = 'true'
            process.env.WERCKER_MAIN_PIPELINE_STARTED = 'true'
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.WERCKER
            delete process.env.WERCKER_MAIN_PIPELINE_STARTED
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
    it('return false if browser not defined', () => {
        expect(isBrowserstackSession(undefined)).toEqual(false)
    })
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
    const mockedGot = jest.mocked(got)

    it('return error if completed but jwt token not present', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        delete process.env.BS_TESTOPS_JWT

        const result: any = await stopBuildUpstream()

        delete process.env.BS_TESTOPS_BUILD_COMPLETED
        expect(result.status).toEqual('error')
        expect(result.message).toEqual('Token/buildID is undefined, build creation might have failed')
    })

    it('return success if completed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'

        mockedGot.put = jest.fn().mockReturnValue({
            json: () => Promise.resolve({}),
        } as any)

        const result: any = await stopBuildUpstream()
        expect(got.put).toHaveBeenCalled()
        expect(result.status).toEqual('success')
    })

    it('return error if failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'

        mockedGot.put = jest.fn().mockReturnValue({
            json: () => Promise.reject({}),
        } as any)

        const result: any = await stopBuildUpstream()
        expect(got.put).toHaveBeenCalled()
        expect(result.status).toEqual('error')
    })

    afterEach(() => {
        (got.put as jest.Mock).mockClear()
    })
})

describe('launchTestSession', () => {
    const mockedGot = jest.mocked(got)
    jest.mocked(gitRepoInfo).mockReturnValue({} as any)

    it('return undefined if completed', async () => {
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ build_hashed_id: 'build_id', jwt: 'jwt' }),
        } as any)

        const result: any = await launchTestSession( { framework: 'framework' } as any, { }, {})
        expect(got.post).toBeCalledTimes(1)
        expect(result).toEqual(undefined)
    })
})

describe('uploadEventData', () => {
    const mockedGot = jest.mocked(got)

    it('got.post called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.reject({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post not called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        delete process.env.BS_TESTOPS_JWT
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(0)
    })

    it('return if BS_TESTOPS_BUILD_COMPLETED not defined', async () => {
        delete process.env.BS_TESTOPS_BUILD_COMPLETED
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(0)
    })
})

describe('batchAndPostEvents', () => {
    const mockedGot = jest.mocked(got)

    it('got.post called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await batchAndPostEvents('', 'kind', [{ event_type: 'testRunStarted' }] )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.reject({ }),
        } as any)

        await batchAndPostEvents('', 'kind', [{ event_type: 'testRunStarted' }] )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post not called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        delete process.env.BS_TESTOPS_JWT
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await batchAndPostEvents('', 'kind', [{ event_type: 'testRunStarted' }] )
        expect(got.post).toBeCalledTimes(0)
    })

    it('return if BS_TESTOPS_BUILD_COMPLETED not defined', async () => {
        delete process.env.BS_TESTOPS_BUILD_COMPLETED
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await batchAndPostEvents('', 'kind', [{ event_type: 'testRunStarted' }] )
        expect(got.post).toBeCalledTimes(0)
    })
})

describe('getLogTag', () => {

    it('return correct tag', () => {
        expect(getLogTag('TestRunStarted')).toEqual('Test_Upload')
        expect(getLogTag('TestRunFinished')).toEqual('Test_Upload')
        expect(getLogTag('HookRunStarted')).toEqual('Hook_Upload')
        expect(getLogTag('HookRunFinished')).toEqual('Hook_Upload')
        expect(getLogTag('ScreenshotCreated')).toEqual('Screenshot_Upload')
        expect(getLogTag('LogCreated')).toEqual('Log_Upload')
    })
})

describe('getHierarchy', () => {
    it('return empty if fullTitle not defined', () => {
        expect(getHierarchy(undefined)).toEqual([])
    })
    it('return array', () => {
        expect(getHierarchy('describe.context.test')).toEqual(['describe', 'context'])
    })
})

describe('getGitMetaData', () => {

    it('return empty object', async () => {
        jest.mocked(gitRepoInfo).mockReturnValue({} as any)
        const result: any = await getGitMetaData()
        expect(result).toEqual({})
    })

    it('return non empty object', async () => {
        jest.mocked(gitRepoInfo).mockReturnValue({ commonGitDir: '/tmp', worktreeGitDir: '/tmp' } as any)
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

describe('shouldAddServiceVersion', () => {
    it('return true', () => {
        expect(shouldAddServiceVersion({}, false)).toEqual(true)
        expect(shouldAddServiceVersion({ services: ['chromedriver'] }, false)).toEqual(true)
    })

    it('return false', () => {
        expect(shouldAddServiceVersion({ services: ['chromedriver'] }, true)).toEqual(false)
    })
})

describe('o11yErrorHandler', () => {
    let spy: any
    beforeEach(() => {
        spy = jest.spyOn(CrashReporter, 'uploadCrashReport')
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
            return await new Promise(resolve => {
                if (a === 0 && b === 0) {
                    throw 'zero error'
                }
                resolve(a * b)
            })
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
            failure: [{ backtrace: [error.stack?.toString()] }]
        })
    })
})

describe('validateCapsWithA11y', () => {
    let logInfoMock: any
    beforeEach(() => {
        logInfoMock = jest.spyOn(log, 'warn')
    })

    afterEach(() => {
        logInfoMock.mockClear()
        logInfoMock.mockReset()
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
    it('returns true if full test name contains includeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { includeTagsInTestingScope: 'title' })).toEqual(true)
    })

    it('returns false if full test name contains excludeTags', async () => {
        expect(shouldScanTestForAccessibility('suite title', 'test title', { excludeTagsInTestingScope: 'title' })).toEqual(true)
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
    const logInfoMock = jest.spyOn(log, 'error')

    beforeEach (() => {
        jest.mocked(gitRepoInfo).mockReturnValue({} as any)
    })

    afterEach(() => {
        logInfoMock.mockClear()
        logInfoMock.mockReset()
    })

    it('return null if BrowserStack credentials arre undefined', async () => {
        const result: any = await createAccessibilityTestRun( { framework: 'framework' } as any, {})
        expect(result).toEqual(null)
        expect(logInfoMock.mock.calls[2][0])
            .toContain('Exception while creating test run for BrowserStack Accessibility Automation: Missing BrowserStack credentials')
    })

    it('return undefined if completed', async () => {
        jest.spyOn(utils, 'getGitMetaData').mockReturnValue({} as any)
        jest.mocked(got).mockReturnValue({
            json: () => Promise.resolve({ data: { accessibilityToken: 'someToken', id: 'id', scannerVersion: '0.0.6.0' } }),
        } as any)

        const result: any = await createAccessibilityTestRun( { framework: 'framework' } as any, { user: 'user', key: 'key' }, {})
        expect(got).toBeCalledTimes(1)
        expect(result).toEqual('0.0.6.0')
    })

    it('return undefined if completed', async () => {
        jest.spyOn(utils, 'getGitMetaData').mockReturnValue({} as any)
        jest.mocked(got).mockReturnValue({
            json: () => Promise.resolve({ accessibilityToken: 'someToken', id: 'id', scannerVersion: '0.0.6.0' }),
        } as any)

        const result: any = await createAccessibilityTestRun( { framework: 'framework' } as any, { user: 'user', key: 'key' }, {})
        expect(got).toBeCalledTimes(1)
        expect(result).toEqual(null)
        expect(logInfoMock.mock.calls[0][0]).toContain('Exception while creating test run for BrowserStack Accessibility Automation')
    })

    afterEach(() => {
        (got as any as jest.Mock).mockClear()
    })
})

describe('stopAccessibilityTestRun', () => {
    beforeEach (() => {
        jest.mocked(gitRepoInfo).mockReturnValue({} as any)
    })

    it('return error object if ally token not defined', async () => {
        process.env.BSTACK_A11Y_JWT = undefined
        const result: any = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': 'Build creation had failed.', 'status': 'error' })
    })

    it('return success object if ally token defined and no error in response data', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        jest.mocked(got).mockReturnValue({
            json: () => Promise.resolve({ data: {} }),
        } as any)
        const result: any = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': '', 'status': 'success' })
    })

    it('return error object if ally token defined and no error in response data', async () => {
        process.env.BSTACK_A11Y_JWT = 'someToken'
        jest.mocked(got).mockReturnValue({
            json: () => Promise.resolve({ data: { error: 'Some Error occurred' } }),
        } as any)
        const result: any = await utils.stopAccessibilityTestRun()
        expect(result).toEqual({ 'message': 'Invalid request: Some Error occurred', 'status': 'error' })
    })

    afterEach(() => {
        (got as any as jest.Mock).mockClear()
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
        getInstance: jest.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: jest.fn(),
        executeAsync: async () => { 'done' },
        on: jest.fn(),
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return false if BrowserStack Session', async () => {
        const result: any = await utils.getA11yResults((browser as WebdriverIO.Browser), false, false)
        expect(result).toEqual([])
    })

    it('return success object if ally token defined and no error in response data', async () => {
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResults((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual([])
    })

    it('return results object if bstack as well as accessibility session', async () => {
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        await utils.getA11yResults((browser as WebdriverIO.Browser), true, true)
        expect(browser.execute).toBeCalledTimes(1)
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
        getInstance: jest.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: jest.fn(),
        executeAsync: async () => { 'done' },
        on: jest.fn(),
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    it('return false if BrowserStack Session', async () => {
        const result: any = await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), false, false)
        expect(result).toEqual({})
    })

    it('return success object if ally token defined and no error in response data', async () => {
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(false)
        const result: any = await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), true, false)
        expect(result).toEqual({})
    })

    it('return results object if bstack as well as accessibility session', async () => {
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        await utils.getA11yResultsSummary((browser as WebdriverIO.Browser), true, true)
        expect(browser.execute).toBeCalledTimes(1)
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

describe('ObjectsAreEqual', function () {
    it('should return true for equal values ', function () {
        expect(utils.ObjectsAreEqual({ 'a': true }, { 'a': true })).toEqual(true)
    })

    it('should return false for unequal lengths', function () {
        expect(utils.ObjectsAreEqual({ 'a': true }, { 'a': true, 'b': false })).toEqual(false)
    })

    it('should return false for unequal values', function () {
        expect(utils.ObjectsAreEqual({ 'a': true }, { 'b': false })).toEqual(false)
    })
})
