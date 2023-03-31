import { hostname, platform, type, version, arch } from 'node:os'
import { promisify } from 'node:util'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

import type { Capabilities, Frameworks, Options } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'
import logger from '@wdio/logger'

import got, { HTTPError } from 'got'
import type { GitRepoInfo } from 'git-repo-info'
import gitRepoInfo from 'git-repo-info'
import gitconfig from 'gitconfiglocal'

import type { UserConfig, UploadType, LaunchResponse, BrowserstackConfig } from './types.js'
import type { ITestCaseHookParameter } from './cucumber-types.js'
import { BROWSER_DESCRIPTION, DATA_ENDPOINT, DATA_EVENT_ENDPOINT, DATA_SCREENSHOT_ENDPOINT } from './constants.js'
import RequestQueueHandler from './request-handler.js'

const pGitconfig = promisify(gitconfig)
const log = logger('@wdio/browserstack-service')

const DEFAULT_REQUEST_CONFIG = {
    agent: {
        http: new http.Agent({ keepAlive: true }),
        https: new https.Agent({ keepAlive: true }),
    },
    headers: {
        'Content-Type': 'application/json',
        'X-BSTACK-OBS': 'true'
    },
}

/**
 * get browser description for Browserstack service
 * @param cap browser capablities
 */
export function getBrowserDescription(cap: Capabilities.DesiredCapabilities) {
    cap = cap || {}
    if (cap['bstack:options']) {
        cap = { ...cap, ...cap['bstack:options'] } as Capabilities.DesiredCapabilities
    }

    /**
     * These keys describe the browser the test was run on
     */
    return BROWSER_DESCRIPTION
        .map((k: keyof Capabilities.DesiredCapabilities) => cap[k])
        .filter(Boolean)
        .join(' ')
}

/**
 * get correct browser capabilities object in both multiremote and normal setups
 * @param browser browser object
 * @param caps browser capbilities object. In case of multiremote, the object itself should have a property named 'capabilities'
 * @param browserName browser name in case of multiremote
 */
export function getBrowserCapabilities(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, caps?: Capabilities.RemoteCapability, browserName?: string) {
    if (!browser.isMultiremote) {
        return { ...browser.capabilities, ...caps } as Capabilities.Capabilities
    }

    const multiCaps = caps as Capabilities.MultiRemoteCapabilities
    const globalCap = browserName && browser.getInstance(browserName) ? browser.getInstance(browserName).capabilities : {}
    const cap = browserName && multiCaps[browserName] ? multiCaps[browserName].capabilities : {}
    return { ...globalCap, ...cap } as Capabilities.Capabilities
}

/**
 * check for browserstack W3C capabilities. Does not support legacy capabilities
 * @param cap browser capabilities
 */
export function isBrowserstackCapability(cap?: Capabilities.Capabilities) {
    return Boolean(
        cap &&
            cap['bstack:options'] &&
            // return false if the only cap in bstack:options is wdioService,
            // as that is added by the service and not present in user passed caps
            !(
                Object.keys(cap['bstack:options']).length === 1 &&
                cap['bstack:options'].wdioService
            )
    )
}

export function getParentSuiteName(fullTitle: string, testSuiteTitle: string): string {
    const fullTitleWords = fullTitle.split(' ')
    const testSuiteTitleWords = testSuiteTitle.split(' ')
    const shortestLength = Math.min(fullTitleWords.length, testSuiteTitleWords.length)
    let c = 0
    let parentSuiteName = ''
    while (c < shortestLength && fullTitleWords[c] === testSuiteTitleWords[c]) {
        parentSuiteName += fullTitleWords[c++] + ' '
    }
    return parentSuiteName.trim()
}

export async function launchTestSession (options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig) {
    const data = {
        format: 'json',
        project_name: getObservabilityProject(options, bsConfig.projectName),
        name: getObservabilityBuild(options, bsConfig.buildName),
        build_identifier: bsConfig.buildIdentifier,
        start_time: (new Date()).toISOString(),
        tags: getObservabilityBuildTags(options, bsConfig.buildTag),
        host_info: {
            hostname: hostname(),
            platform: platform(),
            type: type(),
            version: version(),
            arch: arch()
        },
        ci_info: getCiInfo(),
        build_run_identifier: process.env.BROWSERSTACK_BUILD_RUN_IDENTIFIER,
        failed_tests_rerun: process.env.BROWSERSTACK_RERUN || false,
        version_control: await getGitMetaData(),
        observability_version: {
            frameworkName: 'WebdriverIO-' + config.framework,
            sdkVersion: bsConfig.bstackServiceVersion
        }
    }
    try {
        const url = `${DATA_ENDPOINT}/api/v1/builds`
        const response: LaunchResponse = await got.post(url, {
            ...DEFAULT_REQUEST_CONFIG,
            username: getObservabilityUser(options, config),
            password: getObservabilityKey(options, config),
            json: data
        }).json()
        log.debug(`[Start_Build] Success response: ${JSON.stringify(response)}`)
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        if (response.jwt) {
            process.env.BS_TESTOPS_JWT = response.jwt
        }
        if (response.build_hashed_id) {
            process.env.BS_TESTOPS_BUILD_HASHED_ID = response.build_hashed_id
        }
        if (response.allow_screenshots) {
            process.env.BS_TESTOPS_ALLOW_SCREENSHOTS = response.allow_screenshots.toString()
        }
    } catch (error) {
        if (error instanceof HTTPError && error.response) {
            const errorMessageJson = error.response.body ? JSON.parse(error.response.body.toString()) : null
            const errorMessage = errorMessageJson ? errorMessageJson.message : null, errorType = errorMessageJson ? errorMessageJson.errorType : null
            switch (errorType) {
            case 'ERROR_INVALID_CREDENTIALS':
                log.error(errorMessage)
                break
            case 'ERROR_ACCESS_DENIED':
                log.info(errorMessage)
                break
            case 'ERROR_SDK_DEPRECATED':
                log.error(errorMessage)
                break
            default:
                log.error(errorMessage)
            }
        } else {
            log.error(`Data upload to BrowserStack Test Observability failed due to ${error}`)
        }
    }
}

export async function stopBuildUpstream () {
    if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
        return
    }
    if (!process.env.BS_TESTOPS_JWT) {
        log.debug('[STOP_BUILD] Missing Authentication Token/ Build ID')
        return {
            status: 'error',
            message: 'Token/buildID is undefined, build creation might have failed'
        }
    }
    const data = {
        'stop_time': (new Date()).toISOString()
    }

    try {
        const url = `${DATA_ENDPOINT}/api/v1/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID}/stop`
        const response = await got.put(url, {
            agent: DEFAULT_REQUEST_CONFIG.agent,
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`
            },
            json: data
        }).json()
        log.debug(`[STOP_BUILD] Success response: ${JSON.stringify(response)}`)
        return {
            status: 'success',
            message: ''
        }
    } catch (error: any) {
        log.debug(`[STOP_BUILD] Failed. Error: ${error}`)
        return {
            status: 'error',
            message: error.message
        }
    }
}

export function getCiInfo () {
    const env = process.env
    // Jenkins
    if ((typeof env.JENKINS_URL === 'string' && env.JENKINS_URL.length > 0) || (typeof env.JENKINS_HOME === 'string' && env.JENKINS_HOME.length > 0)) {
        return {
            name: 'Jenkins',
            build_url: env.BUILD_URL,
            job_name: env.JOB_NAME,
            build_number: env.BUILD_NUMBER
        }
    }
    // CircleCI
    if (env.CI === 'true' && env.CIRCLECI === 'true') {
        return {
            name: 'CircleCI',
            build_url: env.CIRCLE_BUILD_URL,
            job_name: env.CIRCLE_JOB,
            build_number: env.CIRCLE_BUILD_NUM
        }
    }
    // Travis CI
    if (env.CI === 'true' && env.TRAVIS === 'true') {
        return {
            name: 'Travis CI',
            build_url: env.TRAVIS_BUILD_WEB_URL,
            job_name: env.TRAVIS_JOB_NAME,
            build_number: env.TRAVIS_BUILD_NUMBER
        }
    }
    // Codeship
    if (env.CI === 'true' && env.CI_NAME === 'codeship') {
        return {
            name: 'Codeship',
            build_url: null,
            job_name: null,
            build_number: null
        }
    }
    // Bitbucket
    if (env.BITBUCKET_BRANCH && env.BITBUCKET_COMMIT) {
        return {
            name: 'Bitbucket',
            build_url: env.BITBUCKET_GIT_HTTP_ORIGIN,
            job_name: null,
            build_number: env.BITBUCKET_BUILD_NUMBER
        }
    }
    // Drone
    if (env.CI === 'true' && env.DRONE === 'true') {
        return {
            name: 'Drone',
            build_url: env.DRONE_BUILD_LINK,
            job_name: null,
            build_number: env.DRONE_BUILD_NUMBER
        }
    }
    // Semaphore
    if (env.CI === 'true' && env.SEMAPHORE === 'true') {
        return {
            name: 'Semaphore',
            build_url: env.SEMAPHORE_ORGANIZATION_URL,
            job_name: env.SEMAPHORE_JOB_NAME,
            build_number: env.SEMAPHORE_JOB_ID
        }
    }
    // GitLab
    if (env.CI === 'true' && env.GITLAB_CI === 'true') {
        return {
            name: 'GitLab',
            build_url: env.CI_JOB_URL,
            job_name: env.CI_JOB_NAME,
            build_number: env.CI_JOB_ID
        }
    }
    // Buildkite
    if (env.CI === 'true' && env.BUILDKITE === 'true') {
        return {
            name: 'Buildkite',
            build_url: env.BUILDKITE_BUILD_URL,
            job_name: env.BUILDKITE_LABEL || env.BUILDKITE_PIPELINE_NAME,
            build_number: env.BUILDKITE_BUILD_NUMBER
        }
    }
    // Visual Studio Team Services
    if (env.TF_BUILD === 'True') {
        return {
            name: 'Visual Studio Team Services',
            build_url: `${env.SYSTEM_TEAMFOUNDATIONSERVERURI}${env.SYSTEM_TEAMPROJECTID}`,
            job_name: env.SYSTEM_DEFINITIONID,
            build_number: env.BUILD_BUILDID
        }
    }
    // if no matches, return null
    return null
}

export async function getGitMetaData () {
    const info: GitRepoInfo = gitRepoInfo()
    if (!info.commonGitDir) {
        return
    }
    const { remote } = await pGitconfig(info.commonGitDir)
    const remotes = Object.keys(remote).map(remoteName =>  ({ name: remoteName, url: remote[remoteName].url }))
    return {
        name: 'git',
        sha: info.sha,
        short_sha: info.abbreviatedSha,
        branch: info.branch,
        tag: info.tag,
        committer: info.committer,
        committer_date: info.committerDate,
        author: info.author,
        author_date: info.authorDate,
        commit_message: info.commitMessage,
        root: info.root,
        common_git_dir: info.commonGitDir,
        worktree_git_dir: info.worktreeGitDir,
        last_tag: info.lastTag,
        commits_since_last_tag: info.commitsSinceLastTag,
        remotes: remotes
    }
}

export function getUniqueIdentifier(test: Frameworks.Test): string {
    return `${test.parent} - ${test.title}`
}

export function getUniqueIdentifierForCucumber(world: ITestCaseHookParameter): string {
    return world.pickle.uri + '_' + world.pickle.astNodeIds.join(',')
}

export function getCloudProvider(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser): string {
    if (browser.options && browser.options.hostname && browser.options.hostname.includes('browserstack')) {
        return 'browserstack'
    }
    return 'unknown_grid'
}

export function isBrowserstackSession(browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    return browser && getCloudProvider(browser).toLowerCase() === 'browserstack'
}

export function getScenarioExamples(world: ITestCaseHookParameter) {
    const scenario = world.pickle

    // no examples present
    if ((scenario.astNodeIds && scenario.astNodeIds.length <= 1) || scenario.astNodeIds === undefined) {
        return
    }

    const pickleId: string = scenario.astNodeIds[0]
    const examplesId: string = scenario.astNodeIds[1]
    const gherkinDocumentChildren = world.gherkinDocument.feature?.children

    let examples: string[] = []

    gherkinDocumentChildren?.forEach(child => {
        if (child.rule) {
            // handle if rule is present
            child.rule.children.forEach(childLevel2 => {
                if (childLevel2.scenario && childLevel2.scenario.id === pickleId && childLevel2.scenario.examples) {
                    const passedExamples = childLevel2.scenario.examples.flatMap((val) => (val.tableBody)).find((item) => item.id === examplesId)?.cells.map((val) => (val.value))
                    if (passedExamples) {
                        examples = passedExamples
                    }
                }
            })
        } else if (child.scenario && child.scenario.id === pickleId && child.scenario.examples) {
            // handle if scenario outside rule
            const passedExamples = child.scenario.examples.flatMap((val) => (val.tableBody)).find((item) => item.id === examplesId)?.cells.map((val) => (val.value))
            if (passedExamples) {
                examples = passedExamples
            }
        }
    })

    if (examples.length) {
        return examples
    }
    return
}

export function removeAnsiColors(message: string): string {
    // https://stackoverflow.com/a/29497680
    // eslint-disable-next-line no-control-regex
    return message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
}

export function getLogTag(eventType: string): string {
    if (eventType === 'TestRunStarted' || eventType === 'TestRunFinished') {
        return 'Test_Upload'
    } else if (eventType === 'HookRunStarted' || eventType === 'HookRunFinished') {
        return 'Hook_Upload'
    } else if (eventType === 'ScreenshotCreated') {
        return 'Screenshot_Upload'
    } else if (eventType === 'LogCreated') {
        return 'Log_Upload'
    }
    return 'undefined'
}

export async function uploadEventData (eventData: UploadType | Array<UploadType>, eventUrl: string = DATA_EVENT_ENDPOINT) {
    let logTag: string = 'BATCH_UPLOAD'
    if (!Array.isArray(eventData)) {
        logTag = getLogTag(eventData.event_type)
    }

    if (eventUrl === DATA_SCREENSHOT_ENDPOINT) {
        logTag = 'screenshot_upload'
    }

    if (!process.env.BS_TESTOPS_BUILD_COMPLETED) {
        return
    }

    if (!process.env.BS_TESTOPS_JWT) {
        log.debug(`[${logTag}] Missing Authentication Token/ Build ID`)
        return {
            status: 'error',
            message: 'Token/buildID is undefined, build creation might have failed'
        }
    }

    try {
        const url = `${DATA_ENDPOINT}/${eventUrl}`
        RequestQueueHandler.getInstance().pendingUploads += 1
        const data = await got.post(url, {
            agent: DEFAULT_REQUEST_CONFIG.agent,
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`
            },
            json: eventData
        }).json()
        log.debug(`[${logTag}] Success response: ${JSON.stringify(data)}`)
        RequestQueueHandler.getInstance().pendingUploads -= 1
    } catch (error) {
        log.debug(`[${logTag}] Failed. Error: ${error}`)
        RequestQueueHandler.getInstance().pendingUploads -= 1
    }
}

// get hierarchy for a particular test (called by reporter for skipped tests)
export function getHierarchy(fullTitle?: string) {
    if (!fullTitle) {
        return []
    }
    return fullTitle.split('.').slice(0, -1)
}

export function getHookType (hookName: string): string {
    if (hookName.includes('before each')) {
        return 'BEFORE_EACH'
    } else if (hookName.includes('before all')) {
        return 'BEFORE_ALL'
    } else if (hookName.includes('after each')) {
        return 'AFTER_EACH'
    } else if (hookName.includes('after all')) {
        return 'AFTER_ALL'
    }
    return 'unknown'
}

export function isScreenshotCommand (args: BeforeCommandArgs & AfterCommandArgs) {
    return args.endpoint && args.endpoint.includes('/screenshot')
}

export function shouldAddServiceVersion(config: Options.Testrunner, testObservability?: boolean): boolean {
    if (config.services && config.services.toString().includes('chromedriver') && testObservability !== false) {
        return false
    }
    return true
}

export async function batchAndPostEvents (eventUrl: string, kind: string, data: UploadType[]) {
    if (!process.env.BS_TESTOPS_BUILD_COMPLETED || !process.env.BS_TESTOPS_JWT) {
        return
    }

    try {
        const url = `${DATA_ENDPOINT}/${eventUrl}`
        const response = await got.post(url, {
            agent: DEFAULT_REQUEST_CONFIG.agent,
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`
            },
            json: data
        }).json()
        log.debug(`[${kind}] Success response: ${JSON.stringify(response)}`)
    } catch (error) {
        log.debug(`[${kind}] EXCEPTION IN ${kind} REQUEST TO TEST OBSERVABILITY : ${error}`)
    }
}

export function getObservabilityUser(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner) {
    if (process.env.BROWSERSTACK_USERNAME) {
        return process.env.BROWSERSTACK_USERNAME
    }
    if (options.testObservabilityOptions && options.testObservabilityOptions.user) {
        return options.testObservabilityOptions.user
    }
    return config.user
}

export function getObservabilityKey(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner) {
    if (process.env.BROWSERSTACK_ACCESS_KEY) {
        return process.env.BROWSERSTACK_ACCESS_KEY
    }
    if (options.testObservabilityOptions && options.testObservabilityOptions.key) {
        return options.testObservabilityOptions.key
    }
    return config.key
}

export function getObservabilityProject(options: BrowserstackConfig & Options.Testrunner, bstackProjectName?: string) {
    if (process.env.TEST_OBSERVABILITY_PROJECT_NAME) {
        return process.env.TEST_OBSERVABILITY_PROJECT_NAME
    }
    if (options.testObservabilityOptions && options.testObservabilityOptions.projectName) {
        return options.testObservabilityOptions.projectName
    }
    return bstackProjectName
}

export function getObservabilityBuild(options: BrowserstackConfig & Options.Testrunner, bstackBuildName?: string) {
    if (process.env.TEST_OBSERVABILITY_BUILD_NAME) {
        return process.env.TEST_OBSERVABILITY_BUILD_NAME
    }
    if (options.testObservabilityOptions && options.testObservabilityOptions.buildName) {
        return options.testObservabilityOptions.buildName
    }
    return bstackBuildName || path.basename(path.resolve(process.cwd()))
}

export function getObservabilityBuildTags(options: BrowserstackConfig & Options.Testrunner, bstackBuildTag?: string): string[] {
    if (process.env.TEST_OBSERVABILITY_BUILD_TAG) {
        return process.env.TEST_OBSERVABILITY_BUILD_TAG.split(',')
    }
    if (options.testObservabilityOptions && options.testObservabilityOptions.buildTag) {
        return options.testObservabilityOptions.buildTag
    }
    if (bstackBuildTag) {
        return [bstackBuildTag]
    }
    return []
}

export const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))
