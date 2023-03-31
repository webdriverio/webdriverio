import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import got from 'got'
import gitRepoInfo from 'git-repo-info'
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
    uploadEventData,
    getLogTag,
    getHookType,
    isScreenshotCommand,
    getObservabilityUser,
    getObservabilityKey,
    getObservabilityBuild,
    getObservabilityProject,
    getObservabilityBuildTags
} from '../src/util.js'

vi.mock('got')
vi.mock('git-repo-info')
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))

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
            expect(getCiInfo()).toBeInstanceOf(Object)
            delete process.env.TF_BUILD
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
    const mockedGot = vi.mocked(got)

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

        mockedGot.put = vi.fn().mockReturnValue({
            json: () => Promise.resolve({}),
        } as any)

        const result: any = await stopBuildUpstream()
        expect(got.put).toHaveBeenCalled()
        expect(result.status).toEqual('success')
    })

    it('return error if failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'

        mockedGot.put = vi.fn().mockReturnValue({
            json: () => Promise.reject({}),
        } as any)

        const result: any = await stopBuildUpstream()
        expect(got.put).toHaveBeenCalled()
        expect(result.status).toEqual('error')
    })

    afterEach(() => {
        (got.put as vi.Mock).mockClear()
    })
})

describe('launchTestSession', () => {
    const mockedGot = vi.mocked(got)
    vi.mocked(gitRepoInfo).mockReturnValue({} as any)

    it('return undefined if completed', async () => {
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.resolve({ build_hashed_id: 'build_id', jwt: 'jwt' }),
        } as any)

        const result: any = await launchTestSession( { framework: 'framework' } as any, { }, {})
        expect(got.post).toBeCalledTimes(1)
        expect(result).toEqual(undefined)
    })
})

describe('uploadEventData', () => {
    const mockedGot = vi.mocked(got)

    it('got.post called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.reject({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post not called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        delete process.env.BS_TESTOPS_JWT
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await uploadEventData( { event_type: 'testRunStarted' } )
        expect(got.post).toBeCalledTimes(0)
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
        expect(getHookType('before each hook for test 1')).toEqual('BEFORE_EACH')
        expect(getHookType('after each hook for test 1')).toEqual('AFTER_EACH')
        expect(getHookType('before all hook for test 1')).toEqual('BEFORE_ALL')
        expect(getHookType('after all hook for test 1')).toEqual('AFTER_ALL')
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
