import { hostname, platform, type, version, arch } from 'node:os'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { format, promisify } from 'node:util'
import path from 'node:path'
import util from 'node:util'

import type { Capabilities, Frameworks, Options } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

import type { GitRepoInfo } from 'git-repo-info'
import gitRepoInfo from 'git-repo-info'
import gitconfig from 'gitconfiglocal'
import type { ColorName } from 'chalk'
import { FormData } from 'formdata-node'
import { performance } from 'node:perf_hooks'
import logPatcher from './logPatcher.js'
import PerformanceTester from './instrumentation/performance/performance-tester.js'
import * as PERFORMANCE_SDK_EVENTS from './instrumentation/performance/constants.js'
import { getProductMap, logBuildError, handleErrorForObservability, handleErrorForAccessibility } from './testHub/utils.js'
import type BrowserStackConfig from './config.js'
import type { Errors } from './testHub/utils.js'

import type { UserConfig, UploadType, BrowserstackConfig, BrowserstackOptions, LaunchResponse } from './types.js'
import type { ITestCaseHookParameter } from './cucumber-types.js'
import {
    BROWSER_DESCRIPTION,
    DATA_ENDPOINT,
    UPLOAD_LOGS_ADDRESS,
    UPLOAD_LOGS_ENDPOINT,
    consoleHolder,
    TESTOPS_BUILD_COMPLETED_ENV,
    BROWSERSTACK_TESTHUB_JWT,
    BROWSERSTACK_OBSERVABILITY,
    BROWSERSTACK_ACCESSIBILITY,
    TESTOPS_SCREENSHOT_ENV,
    BROWSERSTACK_TESTHUB_UUID,
    PERF_MEASUREMENT_ENV,
    RERUN_ENV,
    MAX_GIT_META_DATA_SIZE_IN_BYTES,
    GIT_META_DATA_TRUNCATED,
    APP_ALLY_ENDPOINT,
    APP_ALLY_ISSUES_SUMMARY_ENDPOINT,
    APP_ALLY_ISSUES_ENDPOINT,
} from './constants.js'
import CrashReporter from './crash-reporter.js'
import { BStackLogger } from './bstackLogger.js'
import UsageStats from './testOps/usageStats.js'
import TestOpsConfig from './testOps/testOpsConfig.js'

import AccessibilityScripts from './scripts/accessibility-scripts.js'

const pGitconfig = promisify(gitconfig)

export type GitMetaData = {
    name: string;
    sha: string;
    short_sha: string;
    branch: string;
    tag: string | null;
    committer: string;
    committer_date: string;
    author: string;
    author_date: string;
    commit_message: string;
    root: string;
    common_git_dir: string;
    worktree_git_dir: string;
    last_tag: string | null;
    commits_since_last_tag: number;
    remotes: Array<{ name: string; url: string }>;
}

export const DEFAULT_REQUEST_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
        'X-BSTACK-OBS': 'true'
    },
}

export const COLORS: Record<string, ColorName> = {
    error: 'red',
    warn: 'yellow',
    info: 'cyanBright',
    debug: 'green',
    trace: 'cyan',
    progress: 'magenta'
}

/**
 * get browser description for Browserstack service
 * @param cap browser capablities
 */
export function getBrowserDescription(cap: WebdriverIO.Capabilities) {
    cap = cap || {}
    if (cap['bstack:options']) {
        cap = { ...cap, ...cap['bstack:options'] } as WebdriverIO.Capabilities
    }

    /**
     * These keys describe the browser the test was run on
     */
    return BROWSER_DESCRIPTION
        .map((k) => (cap)[k as keyof typeof cap])
        .filter(Boolean)
        .join(' ')
}

/**
 * get correct browser capabilities object in both multiremote and normal setups
 * @param browser browser object
 * @param caps browser capbilities object. In case of multiremote, the object itself should have a property named 'capabilities'
 * @param browserName browser name in case of multiremote
 */
export function getBrowserCapabilities(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, caps?: Capabilities.ResolvedTestrunnerCapabilities, browserName?: string) {
    if (!browser.isMultiremote) {
        return { ...browser.capabilities, ...caps } as WebdriverIO.Capabilities
    }

    const multiCaps = caps as Capabilities.RequestedMultiremoteCapabilities
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

function processError(error: Error, fn: Function, args: unknown[]) {
    BStackLogger.error(`Error in executing ${fn.name} with args ${args}: ${error}`)
    let argsString: string
    try {
        argsString = JSON.stringify(args)
    } catch {
        argsString = util.inspect(args, { depth: 2 })
    }
    CrashReporter.uploadCrashReport(`Error in executing ${fn.name} with args ${argsString} : ${error}`, error && error.stack || 'unknown error')
}

export function o11yErrorHandler(fn: Function) {
    return function (...args: unknown[]) {
        try {
            let functionToHandle = fn
            if (process.env[PERF_MEASUREMENT_ENV]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                functionToHandle = performance.timerify(functionToHandle as any)
            }
            const result = functionToHandle(...args)
            if (result instanceof Promise) {
                return result.catch(error => processError(error, fn, args))
            }
            return result
        } catch (error) {
            processError(error as Error, fn, args)
        }
    }
}

export function errorHandler(fn: Function) {
    return function (...args: unknown[]) {
        try {
            const functionToHandle = fn
            const result = functionToHandle(...args)
            if (result instanceof Promise) {
                return result.catch(error => BStackLogger.error(`Error in executing ${fn.name} with args ${args}: ${error}`))
            }
            return result
        } catch (error) {
            BStackLogger.error(`Error in executing ${fn.name} with args ${args}: ${error}`)
        }
    }
}

export async function nodeRequest(requestType: string, apiEndpoint: string, options: RequestInit, apiUrl: string, timeout: number = 120000) {
    try {

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${apiUrl}/${apiEndpoint}`, {
            method: requestType,
            signal: controller.signal,
            ...options
        })

        // Clear the timeout as the request completed successfully
        clearTimeout(timeoutId)

        return await response.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        BStackLogger.debug(`Error in firing request ${apiUrl}/${apiEndpoint}: ${format(error)}`)
        const isLogUpload = apiEndpoint === UPLOAD_LOGS_ENDPOINT
        if (error && error.response) {
            const errorMessageJson = error.response.body ? JSON.parse(error.response.body.toString()) : null
            const errorMessage = errorMessageJson ? errorMessageJson.message : null
            if (errorMessage) {
                const message = `${errorMessage} - ${error.stack}`
                if (isLogUpload) {
                    BStackLogger.debug(message)
                } else {
                    BStackLogger.error(message)
                }
            }

            if (isLogUpload) {
                return
            }
            throw error
        } else {
            if (isLogUpload) {
                BStackLogger.debug(`Failed to fire api request due to ${error} - ${error.stack}`)
                return
            }
            BStackLogger.debug(`Failed to fire api request due to ${error} - ${error.stack}`)
            throw error
        }
    }
}

// https://tugayilik.medium.com/error-handling-via-try-catch-proxy-in-javascript-54116dbf783f
/*
    A class wrapper for error handling. The wrapper wraps all the methods of the class with a error handler function.
    If any exception occurs in any of the class method, that will get caught in the wrapper which logs and reports the error.
 */
type ClassType = { new(...args: unknown[]): unknown; } // A generic type for a class
export function o11yClassErrorHandler<T extends ClassType>(errorClass: T): T {
    const prototype = errorClass.prototype

    if (Object.getOwnPropertyNames(prototype).length < 2) {
        return errorClass
    }

    Object.getOwnPropertyNames(prototype).forEach((methodName) => {
        const method = prototype[methodName]
        if (typeof method === 'function' && methodName !== 'constructor' && methodName !== 'commandWrapper') {
            // In order to preserve this context, need to define like this
            Object.defineProperty(prototype, methodName, {
                writable: true,
                value: function(...args: unknown[]) {
                    try {
                        const result = (process.env[PERF_MEASUREMENT_ENV] ? performance.timerify(method) : method).call(this, ...args)
                        if (result instanceof Promise) {
                            return result.catch(error => processError(error, method, args))
                        }
                        return result

                    } catch (err) {
                        processError(err as Error, method, args)
                    }
                }
            })
        }
    })

    return errorClass
}

export const processTestObservabilityResponse = (response: LaunchResponse) => {
    if (!response.observability) {
        handleErrorForObservability(null)
        return
    }
    if (!response.observability.success) {
        handleErrorForObservability(response.observability as Errors)
        return
    }
    process.env[BROWSERSTACK_OBSERVABILITY] = 'true'
    if (response.observability.options.allow_screenshots) {
        process.env[TESTOPS_SCREENSHOT_ENV] = response.observability.options.allow_screenshots.toString()
    }
}

interface DataElement {
    [key: string]: unknown
}

export const jsonifyAccessibilityArray = (
    dataArray: DataElement[],
    keyName: keyof DataElement,
    valueName: keyof DataElement
): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    dataArray.forEach((element: Record<string, string>) => {
        result[element[keyName]] = element[valueName]
    })
    return result
}

export const  processAccessibilityResponse = (response: LaunchResponse) => {
    if (!response.accessibility) {
        handleErrorForAccessibility(null)
        return
    }
    if (!response.accessibility.success) {
        handleErrorForAccessibility(response.accessibility as Errors)
        return
    }

    if (response.accessibility.options) {
        const { accessibilityToken, pollingTimeout, scannerVersion } = jsonifyAccessibilityArray(response.accessibility.options.capabilities, 'name', 'value')
        const scriptsJson = {
            'scripts': jsonifyAccessibilityArray(response.accessibility.options.scripts, 'name', 'command'),
            'commands': response.accessibility.options.commandsToWrap.commands
        }
        if (scannerVersion) {
            process.env.BSTACK_A11Y_SCANNER_VERSION = scannerVersion as string
            BStackLogger.debug(`Accessibility scannerVersion ${scannerVersion}`)
        }
        if (accessibilityToken) {
            process.env.BSTACK_A11Y_JWT = accessibilityToken as string
            process.env[BROWSERSTACK_ACCESSIBILITY] = 'true'
        }
        if (pollingTimeout) {
            process.env.BSTACK_A11Y_POLLING_TIMEOUT = pollingTimeout as string
        }
        if (scriptsJson) {
            // @ts-expect-error fix type
            AccessibilityScripts.update(scriptsJson)
            AccessibilityScripts.store()
        }
    }
}

export const processLaunchBuildResponse = (response: LaunchResponse, options: BrowserstackConfig & Options.Testrunner) => {
    if (options.testObservability) {
        processTestObservabilityResponse(response)
    }
    if (options.accessibility) {
        processAccessibilityResponse(response)
    }
}

export const launchTestSession = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.TESTHUB_EVENTS.START, o11yErrorHandler(async function launchTestSession(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig, bStackConfig: BrowserStackConfig) {
    const launchBuildUsage = UsageStats.getInstance().launchBuildUsage
    launchBuildUsage.triggered()

    const data = {
        format: 'json',
        project_name: getObservabilityProject(options, bsConfig.projectName),
        name: getObservabilityBuild(options, bsConfig.buildName),
        build_identifier: bsConfig.buildIdentifier,
        started_at: (new Date()).toISOString(),
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
        failed_tests_rerun: process.env[RERUN_ENV] || false,
        version_control: await getGitMetaData(),
        accessibility: {
            settings: options.accessibilityOptions
        },
        browserstackAutomation: shouldAddServiceVersion(config, options.testObservability),
        framework_details: {
            frameworkName: 'WebdriverIO-' + config.framework,
            frameworkVersion: bsConfig.bstackServiceVersion,
            sdkVersion: bsConfig.bstackServiceVersion,
            language: 'ECMAScript',
            testFramework: {
                name: 'WebdriverIO',
                version: bsConfig.bstackServiceVersion
            }
        },
        product_map: getProductMap(bStackConfig),
        config: {}
    }

    try {
        if (Object.keys(CrashReporter.userConfigForReporting).length === 0) {
            CrashReporter.userConfigForReporting = process.env.USER_CONFIG_FOR_REPORTING !== undefined ? JSON.parse(process.env.USER_CONFIG_FOR_REPORTING) : {}
        }
    } catch (error) {
        return BStackLogger.error(`[Crash_Report_Upload] Failed to parse user config while sending build start event due to ${error}`)
    }
    data.config = CrashReporter.userConfigForReporting

    try {
        const url = `${DATA_ENDPOINT}/api/v2/builds`
        const encodedAuth = Buffer.from(`${getObservabilityUser(options, config)}:${getObservabilityKey(options, config)}`, 'utf8').toString('base64')
        const headers: Record<string, string> = {
            ...DEFAULT_REQUEST_CONFIG.headers,
            Authorization: `Basic ${encodedAuth}`,
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        })
        const jsonResponse: LaunchResponse = await response.json()
        BStackLogger.debug(`[Start_Build] Success response: ${JSON.stringify(jsonResponse)}`)
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        if (jsonResponse.jwt) {
            process.env[BROWSERSTACK_TESTHUB_JWT] = jsonResponse.jwt
        }
        if (jsonResponse.build_hashed_id) {
            process.env[BROWSERSTACK_TESTHUB_UUID] = jsonResponse.build_hashed_id
            TestOpsConfig.getInstance().buildHashedId = jsonResponse.build_hashed_id
            BStackLogger.info(`Testhub started with id: ${TestOpsConfig.getInstance()?.buildHashedId}`)
        }
        processLaunchBuildResponse(jsonResponse, options)
        launchBuildUsage.success()
    } catch (error: unknown) {
        BStackLogger.debug(`TestHub build start failed: ${format(error)}`)
        if (!(error as Error & { success: boolean }).success) {
            launchBuildUsage.failed(error)
            logBuildError(error as Errors)
            return
        }
    }
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateCapsWithAppA11y = (platformMeta?: { [key: string]: any; }) => {
    /* Check if the current driver platform is eligible for AppAccessibility scan */
    if (
        (platformMeta?.platform_name && String(platformMeta?.platform_name).toLowerCase() === 'android') &&
        (platformMeta?.platform_version && parseInt(platformMeta?.platform_version?.toString()) < 11)
    ) {
        BStackLogger.warn('App Accessibility Automation tests are supported on OS version 11 and above for Android devices.')
        return false
    }
    return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateCapsWithA11y = (deviceName?: any, platformMeta?: { [key: string]: any; }, chromeOptions?: any) => {
    /* Check if the current driver platform is eligible for Accessibility scan */
    try {
        if (deviceName) {
            BStackLogger.warn('Accessibility Automation will run only on Desktop browsers.')
            return false
        }

        if (platformMeta?.browser_name?.toLowerCase() !== 'chrome') {
            BStackLogger.warn('Accessibility Automation will run only on Chrome browsers.')
            return false
        }
        const browserVersion = platformMeta?.browser_version
        if ( !isUndefined(browserVersion) && !(browserVersion === 'latest' || parseFloat(browserVersion + '') > 94)) {
            BStackLogger.warn('Accessibility Automation will run only on Chrome browser version greater than 94.')
            return false
        }

        if (chromeOptions?.args?.includes('--headless')) {
            BStackLogger.warn('Accessibility Automation will not run on legacy headless mode. Switch to new headless mode or avoid using headless mode.')
            return false
        }
        return true
    } catch (error) {
        BStackLogger.debug(`Exception in checking capabilities compatibility with Accessibility. Error: ${error}`)
    }
    return false
}

export const shouldScanTestForAccessibility = (suiteTitle: string | undefined, testTitle: string, accessibilityOptions?: { [key: string]: string; }, world?: { [key: string]: unknown; }, isCucumber?: boolean ) => {
    try {
        const includeTags = Array.isArray(accessibilityOptions?.includeTagsInTestingScope) ? accessibilityOptions?.includeTagsInTestingScope : []
        const excludeTags = Array.isArray(accessibilityOptions?.excludeTagsInTestingScope) ? accessibilityOptions?.excludeTagsInTestingScope : []

        if (isCucumber) {
            const tagsList: string[] = []
            ;(world?.pickle as { tags: { name: string }[] })?.tags.map((tag: { [key: string]: string; }) => tagsList.push(tag.name))
            const excluded = excludeTags?.some((exclude) => tagsList.includes(exclude))
            const included = includeTags?.length === 0 || includeTags?.some((include) => tagsList.includes(include))

            return !excluded && included
        }

        const fullTestName = suiteTitle + ' ' + testTitle
        const excluded = excludeTags?.some((exclude) => fullTestName.includes(exclude))
        const included = includeTags?.length === 0 || includeTags?.some((include) => fullTestName.includes(include))

        return !excluded && included
    } catch (error) {
        BStackLogger.debug(`Error while validating test case for accessibility before scanning. Error : ${error}`)
    }
    return false
}

export const isAccessibilityAutomationSession = (accessibilityFlag?: boolean | string) => {
    try {
        const hasA11yJwtToken = typeof process.env.BSTACK_A11Y_JWT === 'string' && process.env.BSTACK_A11Y_JWT.length > 0 && process.env.BSTACK_A11Y_JWT !== 'null' && process.env.BSTACK_A11Y_JWT !== 'undefined'
        return accessibilityFlag && hasA11yJwtToken
    } catch (error) {
        BStackLogger.debug(`Exception in verifying the Accessibility session with error : ${error}`)
    }
    return false
}

export const isAppAccessibilityAutomationSession = (accessibilityFlag?: boolean | string, isAppAutomate?: boolean) => {
    const accessibilityAutomation = isAccessibilityAutomationSession(accessibilityFlag)
    return accessibilityAutomation && isAppAutomate
}

export const formatString = (template: (string | null), ...values: (string | null)[]): string => {
    let i = 0
    if (template === null) {
        return ''
    }
    return template.replace(/%s/g, () => {
        const value = values[i++]
        return value !== null && value !== undefined ? value : ''
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _getParamsForAppAccessibility = ( commandName?: string ): { thTestRunUuid: any, thBuildUuid: any, thJwtToken: any, authHeader: any, scanTimestamp: number, method: string | undefined  } => {
    return {
        'thTestRunUuid': process.env.TEST_ANALYTICS_ID,
        'thBuildUuid': process.env.BROWSERSTACK_TESTHUB_UUID,
        'thJwtToken': process.env.BROWSERSTACK_TESTHUB_JWT,
        'authHeader': process.env.BSTACK_A11Y_JWT,
        'scanTimestamp': Date.now(),
        'method': commandName
    }
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export const performA11yScan = async (isAppAutomate: boolean, browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string, commandName?: string) : Promise<{ [key: string]: any; } | undefined> => {
    if (!isBrowserStackSession) {
        BStackLogger.warn('Not a BrowserStack Automate session, cannot perform Accessibility scan.')
        return // since we are running only on Automate as of now
    }

    if (!isAccessibilityAutomationSession(isAccessibility)) {
        BStackLogger.warn('Not an Accessibility Automation session, cannot perform Accessibility scan.')
        return
    }

    try {
        if (isAppAccessibilityAutomationSession(isAccessibility, isAppAutomate)) {
            const results: unknown = await (browser as WebdriverIO.Browser).execute(formatString(AccessibilityScripts.performScan, JSON.stringify(_getParamsForAppAccessibility(commandName))) as string, {})
            BStackLogger.debug(util.format(results as string))
            return ( results as { [key: string]: any; } | undefined )
        }
        if (AccessibilityScripts.performScan) {
            const results = await executeAccessibilityScript(browser, AccessibilityScripts.performScan, { method: commandName || '' })
            return ( results as { [key: string]: unknown; } | undefined )
        }
        BStackLogger.error('AccessibilityScripts.performScan is null')
        return
    } catch (err) {
        BStackLogger.error('Accessibility Scan could not be performed : ' + err)
        return
    }
}

export const getA11yResults = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS, async (isAppAutomate: boolean, browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string) : Promise<Array<{ [key: string]: any; }>> => {
    if (!isBrowserStackSession) {
        BStackLogger.warn('Not a BrowserStack Automate session, cannot retrieve Accessibility results.')
        return [] // since we are running only on Automate as of now
    }

    if (!isAccessibilityAutomationSession(isAccessibility)) {
        BStackLogger.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results.')
        return []
    }

    try {
        BStackLogger.debug('Performing scan before getting results')
        await performA11yScan(isAppAutomate, browser, isBrowserStackSession, isAccessibility)
        if (AccessibilityScripts.getResults) {
            const results: Array<{ [key: string]: unknown }> = await executeAccessibilityScript(browser, AccessibilityScripts.getResults)
            return results
        }
        BStackLogger.error('AccessibilityScripts.getResults is null')
        return []
    } catch (error: any) {
        BStackLogger.error('No accessibility results were found.')
        BStackLogger.debug(`getA11yResults Failed. Error: ${error}`)
        return []
    }
})

export const getAppA11yResults = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS, async (isAppAutomate: boolean, browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string, sessionId?: string | null) : Promise<Array<{ [key: string]: any; }>> => {
    if (!isBrowserStackSession) {
        return [] // since we are running only on Automate as of now
    }

    if (!isAppAccessibilityAutomationSession(isAccessibility, isAppAutomate)) {
        BStackLogger.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
        return []
    }

    try {
        const apiUrl = `${APP_ALLY_ENDPOINT}/${APP_ALLY_ISSUES_ENDPOINT}`
        const apiRespone = await getAppA11yResultResponse(apiUrl, isAppAutomate, browser, isBrowserStackSession, isAccessibility, sessionId)
        const result = apiRespone?.data?.data?.issues
        BStackLogger.debug(`Polling Result: ${JSON.stringify(result)}`)
        return result
    } catch (error: any)  {
        BStackLogger.error('No accessibility summary was found.')
        BStackLogger.debug(`getAppA11yResults Failed. Error: ${error}`)
        return []
    }
})

export const getAppA11yResultsSummary = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS_SUMMARY, async (isAppAutomate: boolean, browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string, sessionId?: string | null) : Promise<{ [key: string]: any; }> => {
    if (!isBrowserStackSession) {
        return {} // since we are running only on Automate as of now
    }

    if (!isAppAccessibilityAutomationSession(isAccessibility, isAppAutomate)) {
        BStackLogger.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
        return {}
    }

    try {
        const apiUrl = `${APP_ALLY_ENDPOINT}/${APP_ALLY_ISSUES_SUMMARY_ENDPOINT}`
        const apiRespone = await getAppA11yResultResponse(apiUrl, isAppAutomate, browser, isBrowserStackSession, isAccessibility, sessionId)
        const result = apiRespone?.data?.data?.summary
        BStackLogger.debug(`Polling Result: ${JSON.stringify(result)}`)
        return result
    } catch {
        BStackLogger.error('No accessibility summary was found.')
        return {}
    }
})

const getAppA11yResultResponse = async (apiUrl: string, isAppAutomate: boolean, browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string, sessionId?: string | null) : Promise<PollingResult> => {
    BStackLogger.debug('Performing scan before getting results summary')
    await performA11yScan(isAppAutomate, browser, isBrowserStackSession, isAccessibility)
    const upperTimeLimit = process.env.BSTACK_A11Y_POLLING_TIMEOUT ? Date.now() + parseInt(process.env.BSTACK_A11Y_POLLING_TIMEOUT) * 1000 : Date.now() + 30000
    const params = { test_run_uuid: process.env.TEST_ANALYTICS_ID, session_id: sessionId, timestamp: Date.now() } // Query params to pass
    const header = { Authorization: `Bearer ${process.env.BSTACK_A11Y_JWT}` }
    const apiRespone = await pollApi(apiUrl, params, header, upperTimeLimit)
    BStackLogger.debug(`Polling Result: ${JSON.stringify(apiRespone)}`)
    return apiRespone
}

export const getA11yResultsSummary = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.A11Y_EVENTS.GET_RESULTS_SUMMARY, async (isAppAutomate: boolean, browser: WebdriverIO.Browser, isBrowserStackSession?: boolean, isAccessibility?: boolean | string) : Promise<{ [key: string]: any; }> => {
    if (!isBrowserStackSession) {
        return {} // since we are running only on Automate as of now
    }

    if (!isAccessibilityAutomationSession(isAccessibility)) {
        BStackLogger.warn('Not an Accessibility Automation session, cannot retrieve Accessibility results summary.')
        return {}
    }

    try {
        BStackLogger.debug('Performing scan before getting results summary')
        await performA11yScan(isAppAutomate, browser, isBrowserStackSession, isAccessibility)
        if (AccessibilityScripts.getResultsSummary) {
            const summaryResults: { [key: string]: unknown; } = await executeAccessibilityScript(browser, AccessibilityScripts.getResultsSummary)
            return summaryResults
        }
        BStackLogger.error('AccessibilityScripts.getResultsSummary is null')
        return {}
    } catch {
        BStackLogger.error('No accessibility summary was found.')
        return {}
    }
})

export const stopBuildUpstream = PerformanceTester.measureWrapper(PERFORMANCE_SDK_EVENTS.TESTHUB_EVENTS.STOP, o11yErrorHandler(async function stopBuildUpstream() {
    const stopBuildUsage = UsageStats.getInstance().stopBuildUsage
    stopBuildUsage.triggered()
    if (!process.env[TESTOPS_BUILD_COMPLETED_ENV]) {
        stopBuildUsage.failed('Build is not completed yet')
        return {
            status: 'error',
            message: 'Build is not completed yet'
        }
    }

    if (!process.env[BROWSERSTACK_TESTHUB_JWT]) {
        stopBuildUsage.failed('Token/buildID is undefined, build creation might have failed')
        BStackLogger.debug('[STOP_BUILD] Missing Authentication Token/ Build ID')
        return {
            status: 'error',
            message: 'Token/buildID is undefined, build creation might have failed'
        }
    }
    const data = {
        'stop_time': (new Date()).toISOString()
    }

    try {
        const url = `${DATA_ENDPOINT}/api/v1/builds/${process.env[BROWSERSTACK_TESTHUB_UUID]}/stop`
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${process.env[BROWSERSTACK_TESTHUB_JWT]}`
            },
            body: JSON.stringify(data)
        })
        BStackLogger.debug(`[STOP_BUILD] Success response: ${await response.text()}`)
        stopBuildUsage.success()
        return {
            status: 'success',
            message: ''
        }
    } catch (error: unknown) {
        stopBuildUsage.failed(error)
        BStackLogger.debug(`[STOP_BUILD] Failed. Error: ${error}`)
        return {
            status: 'error',
            message: (error as Error).message
        }
    }
}))

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

    let gitMetaData : GitMetaData = {
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

    gitMetaData = checkAndTruncateVCSInfo(gitMetaData)

    return gitMetaData
}

export function getUniqueIdentifier(test: Frameworks.Test, framework?: string): string {
    if (framework === 'jasmine') {
        return test.fullName
    }

    let parentTitle = test.parent
    // Sometimes parent will be an object instead of a string
    if (typeof parentTitle === 'object') {
        parentTitle = (parentTitle as { title: string }).title
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
    if (!message) {
        return ''
    }
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

export function isScreenshotCommand (args: BeforeCommandArgs | AfterCommandArgs) {
    return args.endpoint && args.endpoint.includes('/screenshot')
}

export function isBStackSession(config: Options.Testrunner) {
    if (typeof config.user === 'string' && typeof config.key === 'string' && config.key.length === 20) {
        return true
    }
    return false
}

export function isBrowserstackInfra(config: BrowserstackConfig & Options.Testrunner, caps?: Capabilities.BrowserStackCapabilities): boolean {
    // this is a utility function to check if the basic session or multi remote session is running on Browserstack, mainly by checking the hostname parameter in the given config
    // In case hostname is not present anywhere in the config, it returns true by default as hostname is not a mandatory parameter in the config

    const isBrowserstack = (str: string ): boolean => {
        return str.includes('browserstack.com')
    }

    if ((config.hostname) && !isBrowserstack(config.hostname)) {
        return false
    }

    if (caps && typeof caps === 'object') {
        if (Array.isArray(caps)) {
            for (const capability of caps) {
                if (((capability as Options.Testrunner).hostname) && !isBrowserstack((capability as Options.Testrunner).hostname as string)) {
                    return false
                }
            }
        } else {
            for (const key in caps) {
                const capability = caps[key as keyof Capabilities.BrowserStackCapabilities]
                if (((capability as Options.Testrunner).hostname) && !isBrowserstack((capability as Options.Testrunner).hostname as string)) {
                    return false
                }
            }
        }
    }

    if (!isBStackSession(config)) {
        return false
    }

    return true
}

export function getBrowserStackUserAndKey(config: Options.Testrunner, options: Options.Testrunner) {

    // Fallback 1: Env variables
    // Fallback 2: Service variables in wdio.conf.js (that are received inside options object)
    const envOrServiceVariables = {
        user: getBrowserStackUser(options),
        key: getBrowserStackKey(options)
    }
    if (envOrServiceVariables.user && envOrServiceVariables.key) {
        return envOrServiceVariables
    }

    // Fallback 3: Service variables in testObservabilityOptions object
    // Fallback 4: Service variables in the top level config object
    const o11yVariables = {
        user: getObservabilityUser(options, config),
        key: getObservabilityKey(options, config)
    }
    return o11yVariables

}

export function shouldAddServiceVersion(config: Options.Testrunner, testObservability?: boolean, caps?: Capabilities.BrowserStackCapabilities): boolean {
    if ((config.services && config.services.toString().includes('chromedriver') && testObservability !== false) || !isBrowserstackInfra(config, caps)) {
        return false
    }
    return true
}

export async function batchAndPostEvents (eventUrl: string, kind: string, data: UploadType[]) {
    if (!process.env[TESTOPS_BUILD_COMPLETED_ENV]) {
        throw new Error('Build not completed yet')
    }

    const jwtToken = process.env[BROWSERSTACK_TESTHUB_JWT]
    if (!jwtToken) {
        throw new Error('Missing authentication Token')
    }

    try {
        const url = `${DATA_ENDPOINT}/${eventUrl}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...DEFAULT_REQUEST_CONFIG.headers,
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(data)
        })
        BStackLogger.debug(`[${kind}] Success response: ${JSON.stringify(await response.json())}`)
    } catch (error) {
        BStackLogger.debug(`[${kind}] EXCEPTION IN ${kind} REQUEST TO TEST OBSERVABILITY : ${error}`)
        throw new Error('Exception in request ' + error)
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
        return process.env.BROWSERSTACK_USERNAME as string
    }
    return config.user as string
}

export function getBrowserStackKey(config: Options.Testrunner) {
    if (process.env.BROWSERSTACK_ACCESS_KEY) {
        return process.env.BROWSERSTACK_ACCESS_KEY
    }
    return config.key
}

export function isUndefined(value: unknown) {
    let res = (value === undefined || value === null)
    if (typeof value === 'string') {
        res = res || value === ''
    }
    return res
}

export function isTrue(value?: unknown) {
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

export const patchConsoleLogs = o11yErrorHandler(() => {
    const BSTestOpsPatcher = new logPatcher({})

    Object.keys(consoleHolder).forEach((method: keyof typeof console) => {
        if (!(method in console) || method === 'Console' || typeof console[method] !== 'function') {
            BStackLogger.debug(`Skipping method: ${method}, exists: ${method in console}, type: ${typeof console[method]}`)
            return
        }
        const origMethod: Function = console[method].bind(console)

        console[method] = (...args: unknown[]) => {
            try {
                if (!Object.keys(BSTestOpsPatcher).includes(method)) {
                    origMethod(...args)
                } else {
                    origMethod(...args);
                    (BSTestOpsPatcher as any)[method](...args)
                }
            } catch (error) {
                BStackLogger.debug(`Error while patching console logs : ${error}`)
                origMethod(...args)
            }
        }
    })
})

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

export const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

export async function uploadLogs(user: string | undefined, key: string | undefined, clientBuildUuid: string) {
    if (!user || !key) {
        BStackLogger.debug('Uploading logs failed due to no credentials')
        return
    }

    try {
        const fileContent = await fs.promises.readFile(BStackLogger.logFilePath)
        const uploadAddress = UPLOAD_LOGS_ADDRESS
        const compressed = await new Promise<Buffer>((resolve, reject) => {
            zlib.gzip(fileContent, { level: 1 }, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
        const formData = new FormData()
        formData.append('data', new Blob([compressed]), 'logs.gz')
        formData.append('clientBuildUuid', clientBuildUuid)

        const requestOptions: RequestInit = {
            method: 'POST',
            body: formData as unknown as BodyInit,
            headers: {
                'Authorization': getBasicAuthHeader(user, key)
            }
        } satisfies RequestInit

        const response = await nodeRequest(
            'POST', UPLOAD_LOGS_ENDPOINT, requestOptions, uploadAddress
        )

        return response
    } catch (error) {
        BStackLogger.debug(`Error in uploading logs: ${error}`)
        throw error
    }
}

export const isObject = (object: unknown) => {
    return object !== null && typeof object === 'object' && !Array.isArray(object)
}

export const ObjectsAreEqual = (object1: object, object2: object) => {
    const objectKeys1 = Object.keys(object1)
    const objectKeys2 = Object.keys(object2)
    if (objectKeys1.length !== objectKeys2.length) {
        return false
    }
    for (const key of objectKeys1) {
        const value1 = object1[key as keyof typeof object1]
        const value2 = object2[key as keyof typeof object1]
        const isBothAreObjects = isObject(value1) && isObject(value2)
        if ((isBothAreObjects && !ObjectsAreEqual(value1, value2)) || (!isBothAreObjects && value1 !== value2)) {
            return false
        }
    }
    return true
}

export const getPlatformVersion = o11yErrorHandler(function getPlatformVersion(caps: WebdriverIO.Capabilities, userCaps: WebdriverIO.Capabilities) {
    if (!caps && !userCaps) {
        return undefined
    }

    const bstackOptions = (userCaps)?.['bstack:options']
    const keys = ['platformVersion', 'platform_version', 'osVersion', 'os_version']

    for (const key of keys) {
        if (caps?.[key as keyof WebdriverIO.Capabilities]) {
            BStackLogger.debug(`Got ${key} from driver caps`)
            return String(caps?.[key as keyof WebdriverIO.Capabilities])
        } else if (bstackOptions && bstackOptions?.[key as keyof Capabilities.BrowserStackCapabilities]) {
            BStackLogger.debug(`Got ${key} from user bstack options`)
            return String(bstackOptions?.[key as keyof Capabilities.BrowserStackCapabilities])
        } else if (userCaps[key as keyof WebdriverIO.Capabilities]) {
            BStackLogger.debug(`Got ${key} from user caps`)
            return String(userCaps[key as keyof WebdriverIO.Capabilities])
        }
    }
    return undefined
})

export const getBasicAuthHeader = (username: string, password: string) => {
    const encodedAuth = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
    return `Basic ${encodedAuth}`
}

export const isObjectEmpty = (objectName: unknown) => {
    return (
        objectName &&
        Object.keys(objectName).length === 0 &&
        objectName.constructor === Object
    )
}

export const getErrorString = (err: unknown) => {
    if (!err) {
        return undefined
    }
    if (typeof err === 'string') {
        return  err // works, `e` narrowed to string
    } else if (err instanceof Error) {
        return err.message // works, `e` narrowed to Error
    }
}

export function truncateString(field: string, truncateSizeInBytes: number): string {
    try {
        const bufferSizeInBytes = Buffer.from(GIT_META_DATA_TRUNCATED).length

        const fieldBufferObj = Buffer.from(field)
        const lenOfFieldBufferObj = fieldBufferObj.length
        const finalLen = Math.ceil(lenOfFieldBufferObj - truncateSizeInBytes - bufferSizeInBytes)
        if (finalLen > 0) {
            const truncatedString = fieldBufferObj.subarray(0, finalLen).toString() + GIT_META_DATA_TRUNCATED
            return truncatedString
        }
    } catch (error) {
        BStackLogger.debug(`Error while truncating field, nothing was truncated here: ${error}`)
    }
    return field
}

export function getSizeOfJsonObjectInBytes(jsonData: GitMetaData): number {
    try {
        const buffer = Buffer.from(JSON.stringify(jsonData))

        return buffer.length
    } catch (error) {
        BStackLogger.debug(`Something went wrong while calculating size of JSON object: ${error}`)
    }

    return -1
}

export function checkAndTruncateVCSInfo(gitMetaData: GitMetaData): GitMetaData {
    const gitMetaDataSizeInBytes = getSizeOfJsonObjectInBytes(gitMetaData)

    if (gitMetaDataSizeInBytes && gitMetaDataSizeInBytes > MAX_GIT_META_DATA_SIZE_IN_BYTES) {
        const truncateSize = gitMetaDataSizeInBytes - MAX_GIT_META_DATA_SIZE_IN_BYTES
        const truncatedCommitMessage = truncateString(gitMetaData.commit_message, truncateSize)
        gitMetaData.commit_message = truncatedCommitMessage
        BStackLogger.info(`The commit has been truncated. Size of commit after truncation is ${ getSizeOfJsonObjectInBytes(gitMetaData) / 1024 } KB`)
    }

    return gitMetaData
}

export const hasBrowserName = (cap: Capabilities.WebdriverIOConfig): boolean => {
    if (!cap || !cap.capabilities) {
        return false
    }
    const browserStackCapabilities = cap.capabilities as Capabilities.BrowserStackCapabilities
    return browserStackCapabilities.browserName !== undefined
}

export const isValidCapsForHealing = (caps: WebdriverIO.Capabilities): boolean => {

    // Get all capability values
    const capValues = Object.values(caps)

    // Check if there are any capabilities and if at least one has a browser name
    return capValues.length > 0 && capValues.some(hasBrowserName)
}

export function isTurboScale(options: (BrowserstackConfig & BrowserstackOptions) | undefined): boolean {
    return Boolean(options?.turboScale)
}

export function getObservabilityProduct(options: (BrowserstackConfig & BrowserstackOptions) | undefined, isAppAutomate: boolean | undefined): string {
    return isAppAutomate
        ? 'app-automate'
        : (isTurboScale(options) ? 'turboscale' : 'automate')
}

type PollingResult = {
    data: any;
    headers: Record<string, any>;
    message?: string; // Optional message for timeout cases
}

export async function pollApi(
    url: string,
    params: Record<string, any>,
    headers: Record<string, string>,
    upperLimit: number,
    startTime = Date.now()
): Promise<PollingResult> {
    params.timestamp = Math.round(Date.now() / 1000)
    BStackLogger.debug(`current timestamp ${params.timestamp}`)

    try {
        const response = await makeGetRequest(url, params, headers)
        const responseData = await response.json()
        return {
            data: responseData,
            headers: response.headers,
            message: 'Polling succeeded.',
        }
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            const nextPollTime = parseInt(error.response.headers.get('next_poll_time'), 10) * 1000
            BStackLogger.debug(`timeInMillis ${nextPollTime}`)

            if (isNaN(nextPollTime)) {
                BStackLogger.warn('Invalid or missing `nextPollTime` header. Stopping polling.')
                return {
                    data: {},
                    headers: error.response.headers,
                    message: 'Invalid nextPollTime header value. Polling stopped.',
                }
            }

            const elapsedTime = nextPollTime - Date.now()
            BStackLogger.debug(
                `elapsedTime ${elapsedTime} timeInMillis ${nextPollTime} upperLimit ${upperLimit}`
            )

            if (nextPollTime > upperLimit) {
                BStackLogger.warn('Polling stopped due to upper time limit.')
                return {
                    data: {},
                    headers: error.response.headers,
                    message: 'Polling stopped due to upper time limit.',
                }
            }

            BStackLogger.debug(`Polling again in ${elapsedTime}ms with params:`, params)
            await new Promise((resolve) => setTimeout(resolve, elapsedTime))
            return pollApi(url, params, headers, upperLimit, startTime)
        } else if (error.response) {
            let errorMessage = error.response.statusText
            try {
                const parsedError = JSON.parse(error.response.json())
                errorMessage = parsedError.message
            } catch {
                BStackLogger.debug(`Error parsing pollApi request body ${error.response.body}`)
                errorMessage = 'Unknown error'
            }
            throw {
                data: {},
                headers: {},
                message: errorMessage,
            }
        } else {
            BStackLogger.error(`Unexpected error occurred: ${error}`)
            return { data: {}, headers: {}, message: 'Unexpected error occurred.' }
        }
    }
}

async function makeGetRequest(url: string, params: Record<string, any>, headers: Record<string, string>): Promise<Response> {
    const urlObj = new URL(url)
    Object.keys(params).forEach((key) => urlObj.searchParams.append(key, params[key]))

    const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers,
    })
    if (!response.ok) {
        const error: any = new Error('Request failed')
        error.response = response
        throw error
    }

    return response
}

export async function executeAccessibilityScript<ReturnType>(
    browser: any,
    fnBody: string,
    arg?: unknown
): Promise<ReturnType> {
    return browser.execute(
        `return (function (...bstackSdkArgs) {
            return new Promise((resolve, reject) => {
                const data = bstackSdkArgs[0];
                bstackSdkArgs.push(resolve);
                ${fnBody.replace(/arguments/g, 'bstackSdkArgs')}
            });
        })(${arg ? JSON.stringify(arg) : ''})`
    )
}
