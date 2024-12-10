import InsightsHandler from '../insights-handler.js'
import TestReporter from '../reporter.js'
import { PercyLogger } from './PercyLogger.js'
import { isUndefined } from '../util.js'

const tryRequire = async function (pkg: string, fallback: any) {
    try {
        return (await import(pkg)).default
    } catch {
        return fallback
    }
}

const percySnapshot = await tryRequire('@percy/selenium-webdriver', null)

const percyAppScreenshot = await tryRequire('@percy/appium-app', {})

/* eslint-disable @typescript-eslint/no-unused-vars */
let snapshotHandler = (...args: any[]) => {
    PercyLogger.error('Unsupported driver for percy')
}
if (percySnapshot) {
    snapshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, snapshotName: string, options?: { [key: string]: any }) => {
        if (process.env.PERCY_SNAPSHOT === 'true') {
            let { name, uuid } = InsightsHandler.currentTest
            if (isUndefined(name)) {
                ({ name, uuid } = TestReporter.currentTest)
            }
            options ||= {}
            options = {
                ...options,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
            return percySnapshot(browser, snapshotName, options)
        }
    }
}
export const snapshot = snapshotHandler

/*
This is a helper method which appends some internal fields
to the options object being sent to Percy methods
*/
const screenshotHelper = (type: string, driverOrName: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | string, nameOrOptions?: string | { [key: string]: any }, options?: { [key: string]: any }) => {
    let { name, uuid } = InsightsHandler.currentTest
    if (isUndefined(name)) {
        ({ name, uuid } = TestReporter.currentTest)
    }
    if (!driverOrName || typeof driverOrName === 'string') {
        nameOrOptions ||= {}
        if (typeof nameOrOptions === 'object') {
            nameOrOptions = {
                ...nameOrOptions,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
        }
    } else {
        options ||= {}
        options = {
            ...options,
            testCase: name || '',
            thTestCaseExecutionId: uuid || '',
        }
    }
    if (type === 'app') {
        return percyAppScreenshot(driverOrName, nameOrOptions, options)
    }
    return percySnapshot.percyScreenshot(driverOrName, nameOrOptions, options)
}

/* eslint-disable @typescript-eslint/no-unused-vars */
let screenshotHandler = async (...args: any[]) => {
    PercyLogger.error('Unsupported driver for percy')
}
if (percySnapshot && percySnapshot.percyScreenshot) {
    screenshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | string, screenshotName?: string | { [key: string]: any }, options?: { [key: string]: any }) => {
        return screenshotHelper('web', browser, screenshotName, options)
    }
}
export const screenshot = screenshotHandler

/* eslint-disable @typescript-eslint/no-unused-vars */
let screenshotAppHandler = async (...args: any[]) => {
    PercyLogger.error('Unsupported driver for percy')
}
if (percyAppScreenshot) {
    screenshotAppHandler = (driverOrName: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | string, nameOrOptions?: string | { [key: string]: any }, options?: { [key: string]: any }) => {
        return screenshotHelper('app', driverOrName, nameOrOptions, options)
    }
}
export const screenshotApp = screenshotAppHandler
