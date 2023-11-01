import { hostname, platform, type, version, arch } from 'node:os'
import { promisify } from 'node:util'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import util from 'node:util'

import type { Capabilities, Frameworks, Options } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'
import logger from '@wdio/logger'

import got, { HTTPError } from 'got'
import type { Method } from 'got'
import type { GitRepoInfo } from 'git-repo-info'
import gitRepoInfo from 'git-repo-info'
import gitconfig from 'gitconfiglocal'
import logPatcher from './logPatcher.js'
import PerformanceTester from './performance-tester.js'

import type { UserConfig, UploadType, LaunchResponse, BrowserstackConfig } from './types.js'
import type { ITestCaseHookParameter } from './cucumber-types.js'
import { ACCESSIBILITY_API_URL, BROWSER_DESCRIPTION, DATA_ENDPOINT, DATA_EVENT_ENDPOINT, DATA_SCREENSHOT_ENDPOINT, consoleHolder } from './constants.js'
import RequestQueueHandler from './request-handler.js'
import CrashReporter from './crash-reporter.js'
import { accessibilityResults, accessibilityResultsSummary } from './scripts/test-event-scripts.js'

const pGitconfig = promisify(gitconfig)
const log = logger('@wdio/browserstack-service')

export const DEFAULT_REQUEST_CONFIG = {
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
        return { ...browser.capabilities, ...caps } as WebdriverIO.Capabilities
    }

    const multiCaps = caps as Capabilities.MultiRemoteCapabilities
    const globalCap = browserName && browser.getInstance(browserName) ? browser.getInstance(browserName).capabilities : {}
    const cap = browserName && multiCaps[browserName] ? multiCaps[browserName].capabilities : {}
    return { ...globalCap, ...cap } as WebdriverIO.Capabilities
}

/**
 * check for browserstack W3C capabilities. Does not support legacy capabilities
 * @param cap browser capabilities
 */
export function isBrowserstackCapability(cap?: WebdriverIO.Capabilities) {
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

function processError(error: any, fn: Function, args: any[]) {
    log.error(`Error in executing ${fn.name} with args ${args}: ${error}`)
    let argsString: string
    try {
        argsString = JSON.stringify(args)
    } catch (e) {
        argsString = util.inspect(args, { depth: 2 })
    }
    CrashReporter.uploadCrashReport(`Error in executing ${fn.name} with args ${argsString} : ${error}`, error && error.stack)
}

export function o11yErrorHandler(fn: Function) {
    return function (...args: any) {
        try {
            let functionToHandle = fn
            if (process.env.BROWSERSTACK_O11Y_PERF_MEASUREMENT) {
                functionToHandle = PerformanceTester.getPerformance().timerify(functionToHandle as any)
            }
            const result = functionToHandle(...args)
            if (result instanceof Promise) {
                return result.catch(error => processError(error, fn, args))
            }
            return result
        } catch (error) {
            processError(error, fn, args)
        }
    }
}

export function errorHandler(fn: Function) {
    return function (...args: any) {
        try {
            const functionToHandle = fn
            const result = functionToHandle(...args)
            if (result instanceof Promise) {
                return result.catch(error => log.error(`Error in executing ${fn.name} with args ${args}: ${error}`))
            }
            return result
        } catch (error) {
            log.error(`Error in executing ${fn.name} with args ${args}: ${error}`)
        }
    }
}

export async function nodeRequest(requestType: Method, apiEndpoint: string, options: any, apiUrl: string, timeout: number = 120000) {
    try {
        const response: Object = await got(`${apiUrl}/${apiEndpoint}`, {
            method: requestType,
            timeout: {
                request: timeout
            },
            ...options
        }).json()
        return response
    } catch (error : any) {
        if (error instanceof HTTPError && error.response) {
            const errorMessageJson = error.response.body ? JSON.parse(error.response.body.toString()) : null
            const errorMessage = errorMessageJson ? errorMessageJson.message : null
            if (errorMessage) {
                log.error(`${errorMessage} - ${error.stack}`)
            } else {
                log.error(`${error.stack}`)
            }
            throw error
        } else {
            log.error(`Failed to fire api request due to ${error} - ${error.stack}`)
            throw error
        }
    }
}

// https://tugayilik.medium.com/error-handling-via-try-catch-proxy-in-javascript-54116dbf783f
/*
    A class wrapper for error handling. The wrapper wraps all the methods of the class with a error handler function.
    If any exception occurs in any of the class method, that will get caught in the wrapper which logs and reports the error.
 */
type ClassType = { new(...args: any[]): any; }; // A generic type for a class
export function o11yClassErrorHandler<T extends ClassType>(errorClass: T): T {
    const prototype = errorClass.prototype

    if (Object.getOwnPropertyNames(prototype).length < 2) {
        return errorClass
    }

    Object.getOwnPropertyNames(prototype).forEach((methodName) => {
        const method = prototype[methodName]
        if (typeof method === 'function' && methodName !== 'constructor') {
            // In order to preserve this context, need to define like this
            Object.defineProperty(prototype, methodName, {
                writable: true,
                value: function(...args: any) {
                    try {
                        const result = (process.env.BROWSERSTACK_O11Y_PERF_MEASUREMENT ? PerformanceTester.getPerformance().timerify(method) : method).call(this, ...args)
                        if (result instanceof Promise) {
                            return result.catch(error => processError(error, method, args))
                        }
                        return result

                    } catch (err) {
                        processError(err, method, args)
                    }
                }
            })
        }
    })

    return errorClass
}

export const launchTestSession = o11yErrorHandler(async function launchTestSession(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig) {
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
        },
        config: {}
    }

    try {
        if (Object.keys(CrashReporter.userConfigForReporting).length === 0) {
            CrashReporter.userConfigForReporting = process.env.USER_CONFIG_FOR_REPORTING !== undefined ? JSON.parse(process.env.USER_CONFIG_FOR_REPORTING) : {}
        }
    } catch (error) {
        return log.error(`[Crash_Report_Upload] Failed to parse user config while sending build start event due to ${error}`)
    }
    data.config = CrashReporter.userConfigForReporting

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
})

export const validateCapsWithA11y = (deviceName?: any, platformMeta?: { [key: string]: any; }, chromeOptions?: any) => {
    try {
        if (deviceName) {
            log.warn('Accessibility Automation will run only on Desktop browsers.')
            return false
        }

        if (platformMeta?.browser_name?.toLowerCase() !== 'chrome') {
            log.warn('Accessibility Automation will run only on Chrome browsers.')
            return false
        }
        const browserVersion = platformMeta?.browser_version
        if ( !isUndefined(browserVersion) && !(browserVersion === 'latest' || parseFloat(browserVersion + '') > 94)) {
            log.warn('Accessibility Automation will run only on Chrome browser version greater than 94.')
            return false
        }

        if (chromeOptions?.args?.includes('--headless')) {
            log.warn('Accessibility Automation will not run on legacy headless mode. Switch to new headless mode or avoid using headless mode.')
            return false
        }
        return true
    } catch (error) {
        log.debug(`Exception in checking capabilities compatibility with Accessibility. Error: ${error}`)
    }
    return false
}

export const shouldScanTestForAccessibility = (suiteTitle: string | undefined, testTitle: string, accessibilityOptions?: { [key: string]: any; }) => {
    try {
        const includeTags = Array.isArray(accessibilityOptions?.includeTagsInTestingScope) ? accessibilityOptions?.includeTagsInTestingScope : []
        const excludeTags = Array.isArray(accessibilityOptions?.excludeTagsInTestingScope) ? accessibilityOptions?.excludeTagsInTestingScope : []

        const fullTestName = suiteTitle + ' ' + testTitle
        const excluded = excludeTags?.some((exclude) => fullTestName.includes(exclude))
        const included = includeTags?.length === 0 || includeTags?.some((include) => fullTestName.includes(include))

        return !excluded && included
    } catch (error) {
        log.debug('Error while validating test case for accessibility before scanning. Error : ', error)
    }
    return false
}

export const isAccessibilityAutomationSession = (accessibilityFlag?: boolean | string) => {
    try {
        const hasA11yJwtToken = typeof process.env.BSTACK_A11Y_JWT === 'string' && process.env.BSTACK_A11Y_JWT.length > 0 && process.env.BSTACK_A11Y_JWT !== 'null' && process.env.BSTACK_A11Y_JWT !== 'undefined'
        return accessibilityFlag && hasA11yJwtToken
    } catch (error) {
        log.debug(`Exception in verifying the Accessibility session with error : ${error}`)
    }
    return false
}

export const createAccessibilityTestRun = errorHandler(async function createAccessibilityTestRun(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig) {
    const userName = getBrowserStackUser(config)
    const accessKey = getBrowserStackKey(config)

    if (isUndefined(userName) || isUndefined(accessKey)) {
        log.error('Exception while creating test run for BrowserStack Accessibility Automation: Missing BrowserStack credentials')
        return null
    }

    const data = {
        'projectName': bsConfig.projectName,
        'buildName': bsConfig.buildName ||
          path.basename(path.resolve(process.cwd())),
        'startTime': (new Date()).toISOString(),
        'description': '',
        'source': {
            frameworkName: 'WebdriverIO-' + config.framework,
            frameworkVersion: bsConfig.bstackServiceVersion,
            sdkVersion: bsConfig.bstackServiceVersion
        },
        'settings': bsConfig.accessibilityOptions || {},
        'versionControl': await getGitMetaData(),
        'ciInfo': getCiInfo(),
        'hostInfo': {
            hostname: hostname(),
            platform: platform(),
            type: type(),
            version: version(),
            arch: arch()
        },
        'browserstackAutomation': true,
    }

    const requestOptions = {
        json: data,
        username: getBrowserStackUser(config),
        password: getBrowserStackKey(config),
    }

    try {
        const response: any = await nodeRequest(
            'POST', 'test_runs', requestOptions, ACCESSIBILITY_API_URL
        )

        log.debug(`[Create Accessibility Test Run] Success response: ${JSON.stringify(response)}`)

        if (response.data.accessibilityToken) {
            process.env.BSTACK_A11Y_JWT = response.data.accessibilityToken
        }
        if (response.data.id) {
            process.env.BS_A11Y_TEST_RUN_ID = response.data.id
        }

        log.debug(`BrowserStack Accessibility Automation Test Run ID: ${response.data.id}`)

        return response.data.scannerVersion
    } catch (error : any) {
        if (error.response) {
            log.error(
                `Exception while creating test run for BrowserStack Accessibility Automation: ${
                    error.response.status
                } ${error.response.statusText} ${JSON.stringify(error.response.data)}`
            )
        } else {
            const errorMessage = error.message
            if (errorMessage === 'Invalid configuration passed.') {
                log.error(
                    `Exception while creating test run for BrowserStack Accessibility Automation: ${
                        errorMessage || error.stack
                    }`
                )
                for (const errorkey of error.errors){
                    log.error(errorkey.message)
                }
            } else {
                log.error(
                    `Exception while creating test run for BrowserStack Accessibility Automation: ${
                        errorMessage || error.stack
                    }`
                )
            }
        }
        return null
    }
})

export const getA11yResults = async (browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string) : Promise<Array<{ [key: string]: any; }>> => {
    if (!isBrowserStackSession) {
        log.warn('Not a BrowserStack Automate session, cannot retrieve Accessibility results.')
        return [] // since we are running only on Automate as of now
    }

    if (!isAccessibilityAutomationSession(isAccessibility)) {
        log.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results.')
        return []
    }

    try {
        const results = await (browser as WebdriverIO.Browser).execute(accessibilityResults)
        return results
    } catch {
        log.error('No accessibility results were found.')
        return []
    }
}

export const getA11yResultsSummary = async (browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string) : Promise<{ [key: string]: any; }> => {
    if (!isBrowserStackSession) {
        return {} // since we are running only on Automate as of now
    }

    if (!isAccessibilityAutomationSession(isAccessibility)) {
        log.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
        return {}
    }

    try {
        const summaryResults = await (browser as WebdriverIO.Browser).execute(accessibilityResultsSummary)
        return summaryResults
    } catch {
        log.error('No accessibility summary was found.')
        return {}
    }
}

export const stopAccessibilityTestRun = errorHandler(async function stopAccessibilityTestRun() {
    const hasA11yJwtToken = typeof process.env.BSTACK_A11Y_JWT === 'string' && process.env.BSTACK_A11Y_JWT.length > 0 && process.env.BSTACK_A11Y_JWT !== 'null' && process.env.BSTACK_A11Y_JWT !== 'undefined'
    if (!hasA11yJwtToken) {
        return {
            status: 'error',
            message: 'Build creation had failed.'
        }
    }

    const data = {
        'endTime': (new Date()).toISOString(),
    }

    const requestOptions = { ...{
        json: data,
        headers: {
            'Authorization': `Bearer ${process.env.BSTACK_A11Y_JWT}`,
        }
    } }

    try {
        const response: any = await nodeRequest(
            'PUT', 'test_runs/stop', requestOptions, ACCESSIBILITY_API_URL
        )

        if (response.data && response.data.error) {
            throw new Error('Invalid request: ' + response.data.error)
        } else if (response.error) {
            throw new Error('Invalid request: ' + response.error)
        } else {
            log.info(`BrowserStack Accessibility Automation Test Run marked as completed at ${new Date().toISOString()}`)
            return { status: 'success', message: '' }
        }
    } catch (error : any) {
        if (error.response && error.response.status && error.response.statusText && error.response.data) {
            log.error(`Exception while marking completion of BrowserStack Accessibility Automation Test Run: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`)
        } else {
            log.error(`Exception while marking completion of BrowserStack Accessibility Automation Test Run: ${error.message || util.format(error)}`)
        }
        return {
            status: 'error',
            message: error.message ||
                (error.response ? `${error.response.status}:${error.response.statusText}` : error)
        }
    }
})

export const stopBuildUpstream = o11yErrorHandler(async function stopBuildUpstream() {
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
})

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
    if (isTrue(env.CI) && isTrue(env.CIRCLECI)) {
        return {
            name: 'CircleCI',
            build_url: env.CIRCLE_BUILD_URL,
            job_name: env.CIRCLE_JOB,
            build_number: env.CIRCLE_BUILD_NUM
        }
    }
    // Travis CI
    if (isTrue(env.CI) && isTrue(env.TRAVIS)) {
        return {
            name: 'Travis CI',
            build_url: env.TRAVIS_BUILD_WEB_URL,
            job_name: env.TRAVIS_JOB_NAME,
            build_number: env.TRAVIS_BUILD_NUMBER
        }
    }
    // Codeship
    if (isTrue(env.CI) && env.CI_NAME === 'codeship') {
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
    if (isTrue(env.CI) && isTrue(env.DRONE)) {
        return {
            name: 'Drone',
            build_url: env.DRONE_BUILD_LINK,
            job_name: null,
            build_number: env.DRONE_BUILD_NUMBER
        }
    }
    // Semaphore
    if (isTrue(env.CI) && isTrue(env.SEMAPHORE)) {
        return {
            name: 'Semaphore',
            build_url: env.SEMAPHORE_ORGANIZATION_URL,
            job_name: env.SEMAPHORE_JOB_NAME,
            build_number: env.SEMAPHORE_JOB_ID
        }
    }
    // GitLab
    if (isTrue(env.CI) && isTrue(env.GITLAB_CI)) {
        return {
            name: 'GitLab',
            build_url: env.CI_JOB_URL,
            job_name: env.CI_JOB_NAME,
            build_number: env.CI_JOB_ID
        }
    }
    // Buildkite
    if (isTrue(env.CI) && isTrue(env.BUILDKITE)) {
        return {
            name: 'Buildkite',
            build_url: env.BUILDKITE_BUILD_URL,
            job_name: env.BUILDKITE_LABEL || env.BUILDKITE_PIPELINE_NAME,
            build_number: env.BUILDKITE_BUILD_NUMBER
        }
    }
    // Visual Studio Team Services
    if (isTrue(env.TF_BUILD) && env.TF_BUILD_BUILDNUMBER) {
        return {
            name: 'Visual Studio Team Services',
            build_url: `${env.SYSTEM_TEAMFOUNDATIONSERVERURI}${env.SYSTEM_TEAMPROJECTID}`,
            job_name: env.SYSTEM_DEFINITIONID,
            build_number: env.BUILD_BUILDID
        }
    }
    // Appveyor
    if (isTrue(env.APPVEYOR)) {
        return {
            name: 'Appveyor',
            build_url: `${env.APPVEYOR_URL}/project/${env.APPVEYOR_ACCOUNT_NAME}/${env.APPVEYOR_PROJECT_SLUG}/builds/${env.APPVEYOR_BUILD_ID}`,
            job_name: env.APPVEYOR_JOB_NAME,
            build_number: env.APPVEYOR_BUILD_NUMBER
        }
    }
    // Azure CI
    if (env.AZURE_HTTP_USER_AGENT && env.TF_BUILD) {
        return {
            name: 'Azure CI',
            build_url: `${env.SYSTEM_TEAMFOUNDATIONSERVERURI}${env.SYSTEM_TEAMPROJECT}/_build/results?buildId=${env.BUILD_BUILDID}`,
            job_name: env.BUILD_BUILDID,
            build_number: env.BUILD_BUILDID
        }
    }
    // AWS CodeBuild
    if (env.CODEBUILD_BUILD_ID || env.CODEBUILD_RESOLVED_SOURCE_VERSION || env.CODEBUILD_SOURCE_VERSION) {
        return {
            name: 'AWS CodeBuild',
            build_url: env.CODEBUILD_PUBLIC_BUILD_URL,
            job_name: env.CODEBUILD_BUILD_ID,
            build_number: env.CODEBUILD_BUILD_ID
        }
    }
    // Bamboo
    if (env.bamboo_buildNumber) {
        return {
            name: 'Bamboo',
            build_url: env.bamboo_buildResultsUrl,
            job_name: env.bamboo_shortJobName,
            build_number: env.bamboo_buildNumber
        }
    }
    // Wercker
    if (env.WERCKER || env.WERCKER_MAIN_PIPELINE_STARTED) {
        return {
            name: 'Wercker',
            build_url: env.WERCKER_BUILD_URL,
            job_name: env.WERCKER_MAIN_PIPELINE_STARTED ? 'Main Pipeline' : null,
            build_number: env.WERCKER_GIT_COMMIT
        }
    }
    // Google Cloud
    if (env.GCP_PROJECT || env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT) {
        return {
            name: 'Google Cloud',
            build_url: null,
            job_name: env.PROJECT_ID,
            build_number: env.BUILD_ID,
        }
    }
    // Shippable
    if (env.SHIPPABLE) {
        return {
            name: 'Shippable',
            build_url: env.SHIPPABLE_BUILD_URL,
            job_name: env.SHIPPABLE_JOB_ID ? `Job #${env.SHIPPABLE_JOB_ID}` : null,
            build_number: env.SHIPPABLE_BUILD_NUMBER
        }
    }
    // Netlify
    if (isTrue(env.NETLIFY)) {
        return {
            name: 'Netlify',
            build_url: env.DEPLOY_URL,
            job_name: env.SITE_NAME,
            build_number: env.BUILD_ID
        }
    }
    // Github Actions
    if (isTrue(env.GITHUB_ACTIONS)) {
        return {
            name: 'GitHub Actions',
            build_url: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
            job_name: env.GITHUB_WORKFLOW,
            build_number: env.GITHUB_RUN_ID,
        }
    }
    // Vercel
    if (isTrue(env.CI) && env.VERCEL === '1') {
        return {
            name: 'Vercel',
            build_url: `http://${env.VERCEL_URL}`,
            job_name: null,
            build_number: null,
        }
    }
    // Teamcity
    if (env.TEAMCITY_VERSION) {
        return {
            name: 'Teamcity',
            build_url: null,
            job_name: null,
            build_number: env.BUILD_NUMBER,
        }
    }
    // Concourse
    if (env.CONCOURSE || env.CONCOURSE_URL || env.CONCOURSE_USERNAME || env.CONCOURSE_TEAM) {
        return {
            name: 'Concourse',
            build_url: null,
            job_name: env.BUILD_JOB_NAME || null,
            build_number: env.BUILD_ID || null,
        }
    }
    // GoCD
    if (env.GO_JOB_NAME) {
        return {
            name: 'GoCD',
            build_url: null,
            job_name: env.GO_JOB_NAME,
            build_number: env.GO_PIPELINE_COUNTER,
        }
    }
    // CodeFresh
    if (env.CF_BUILD_ID) {
        return {
            name: 'CodeFresh',
            build_url: env.CF_BUILD_URL,
            job_name: env.CF_PIPELINE_NAME,
            build_number: env.CF_BUILD_ID,
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
    const remotes = remote ? Object.keys(remote).map(remoteName =>  ({ name: remoteName, url: remote[remoteName].url })) : []
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

export function getUniqueIdentifier(test: Frameworks.Test, framework?: string): string {
    if (framework === 'jasmine') {
        return test.fullName
    }

    let parentTitle = test.parent
    // Sometimes parent will be an object instead of a string
    if (typeof parentTitle === 'object') {
        parentTitle = (parentTitle as any).title
    }
    return `${parentTitle} - ${test.title}`
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
    if (hookName.startsWith('"before each"')) {
        return 'BEFORE_EACH'
    } else if (hookName.startsWith('"before all"')) {
        return 'BEFORE_ALL'
    } else if (hookName.startsWith('"after each"')) {
        return 'AFTER_EACH'
    } else if (hookName.startsWith('"after all"')) {
        return 'AFTER_ALL'
    }
    return 'unknown'
}

export function isScreenshotCommand (args: BeforeCommandArgs & AfterCommandArgs) {
    return args.endpoint && args.endpoint.includes('/screenshot')
}

export function isBStackSession(config: Options.Testrunner) {
    if (typeof config.user === 'string' && typeof config.key === 'string' && config.key.length === 20) {
        return true
    }
    return false
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

export function getBrowserStackUser(config: Options.Testrunner) {
    if (process.env.BROWSERSTACK_USERNAME) {
        return process.env.BROWSERSTACK_USERNAME
    }
    return config.user
}

export function getBrowserStackKey(config: Options.Testrunner) {
    if (process.env.BROWSERSTACK_ACCESS_KEY) {
        return process.env.BROWSERSTACK_ACCESS_KEY
    }
    return config.key
}

export function isUndefined(value: any) {
    return value === undefined || value === null
}

export function isTrue(value?: any) {
    return (value + '').toLowerCase() === 'true'
}

export function frameworkSupportsHook(hook: string, framework?: string) {
    if (framework === 'mocha' && (hook === 'before' || hook === 'after' || hook === 'beforeEach' || hook === 'afterEach')) {
        return true
    }

    if (framework === 'cucumber') {
        return true
    }

    return false
}

export function patchConsoleLogs() {
    const BSTestOpsPatcher = new logPatcher({})

    Object.keys(consoleHolder).forEach((method: keyof typeof console) => {
        const origMethod = (console[method] as any).bind(console)

        // Make sure we don't override Constructors
        // Arrow functions are not construable
        if (typeof console[method] === 'function'
            && method !== 'Console'
        ) {
            (console as any)[method] = (...args: unknown[]) => {
                origMethod(...args);
                (BSTestOpsPatcher as any)[method](...args)
            }
        }
    })
}

export function getFailureObject(error: string|Error) {
    const stack = (error as Error).stack
    const message = typeof error === 'string' ? error : error.message
    const backtrace = stack ? removeAnsiColors(stack.toString()) : ''

    return {
        failure: [{ backtrace: [backtrace] }],
        failure_reason: removeAnsiColors(message.toString()),
        failure_type: message ? (message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError') : null
    }
}

export async function pushDataToQueue(data: UploadType, requestQueueHandler: RequestQueueHandler|undefined = undefined) {
    if (!requestQueueHandler) {
        requestQueueHandler = RequestQueueHandler.getInstance()
    }
    const req = requestQueueHandler.add(data)
    if (req.proceed && req.data) {
        await uploadEventData(req.data, req.url)
    }
}

export const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))
