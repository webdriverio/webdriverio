import InsightsHandler from '../insights-handler.js'
import TestReporter from '../reporter.js'
import { PercyLogger } from './PercyLogger.js'

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
    snapshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, snapshotName: string, options?: any) => {
        if (process.env.PERCY_SNAPSHOT === 'true') {
            let { name, uuid } = InsightsHandler._currentTest
            if (!name || name === '') {
                ({ name, uuid } = TestReporter._currentTest)
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

/* eslint-disable @typescript-eslint/no-unused-vars */
let screenshotHandler = async (...args: any[]) => {
    PercyLogger.error('Unsupported driver for percy')
}
if (percySnapshot && percySnapshot.percyScreenshot) {
    screenshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | string, screenshotName: any, options?: any) => {
        let { name, uuid } = InsightsHandler._currentTest
        if (!name || name === '') {
            ({ name, uuid } = TestReporter._currentTest)
        }
        if (!browser || typeof browser === 'string') {
            screenshotName ||= {}
            screenshotName = {
                ...screenshotName,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
        } else {
            options ||= {}
            options = {
                ...options,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
        }
        return percySnapshot.percyScreenshot(browser, screenshotName, options)
    }
}
export const screenshot = screenshotHandler

/* eslint-disable @typescript-eslint/no-unused-vars */
let screenshotAppHandler = async (...args: any[]) => {
    PercyLogger.error('Unsupported driver for percy')
}
if (percyAppScreenshot) {
    screenshotAppHandler = (driverOrName: any, nameOrOptions?: any, options?: any) => {
        let { name, uuid } = InsightsHandler._currentTest
        if (!name || name === '') {
            ({ name, uuid } = TestReporter._currentTest)
        }
        if (!driverOrName || typeof driverOrName === 'string') {
            nameOrOptions ||= {}
            nameOrOptions = {
                ...nameOrOptions,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
        } else {
            options ||= {}
            options = {
                ...options,
                testCase: name || '',
                thTestCaseExecutionId: uuid || '',
            }
        }
        return percyAppScreenshot(driverOrName, nameOrOptions, options)
    }
}
export const screenshotApp = screenshotAppHandler
