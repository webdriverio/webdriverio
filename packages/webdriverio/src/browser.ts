/**
 * Browser-compatible WebdriverIO entry point
 *
 * This file provides a standalone browser build that can be used
 * without @wdio/browser-runner. It explicitly initializes the
 * environment for browser usage.
 *
 * @see https://github.com/webdriverio/webdriverio/issues/14598
 */

import process from 'node:process'
import { Buffer } from 'node:buffer'
import WebDriver from 'webdriver'
import { environment, type EnvironmentDependencies } from './environment.js'
import { setWebdriverImport } from './utils/driver.js'

const BROWSER_LIMITATIONS_DOCS = 'https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/docs/browser-usage.md#limitations'

const globalScope = globalThis as typeof globalThis & {
    process?: typeof process
    Buffer?: typeof Buffer
}

if (!globalScope.process) {
    globalScope.process = process
}

if (!globalScope.Buffer) {
    globalScope.Buffer = Buffer
}

// Ensure browser build doesn't attempt to dynamically import the driver
setWebdriverImport(WebDriver)

/**
 * Explicitly set browser environment values.
 * This ensures deterministic behavior regardless of bundler polyfills.
 */
const browserEnvironment: EnvironmentDependencies = {
    variables: {},
    osType: () => 'browser',
    readFileSync: () => {
        throw new Error(`readFileSync is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    downloadFile: async () => {
        throw new Error(`downloadFile is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    savePDF: async () => {
        throw new Error(`savePDF is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    saveRecordingScreen: async () => {
        throw new Error(`saveRecordingScreen is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    uploadFile: async () => {
        throw new Error(`uploadFile is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    saveScreenshot: async () => {
        throw new Error(`saveScreenshot is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    },
    saveElementScreenshot: async () => {
        throw new Error(`saveElementScreenshot is not available in browser environments. See: ${BROWSER_LIMITATIONS_DOCS}`)
    }
}

// Initialize environment explicitly for browser
environment.value = browserEnvironment

// Re-export everything from the main module
export * from './index.js'
export { remote, attach, multiremote, Key, SevereServiceError } from './index.js'
