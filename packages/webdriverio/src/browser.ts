/**
 * Browser-compatible WebdriverIO entry point
 *
 * This file provides a standalone browser build that can be used
 * without @wdio/browser-runner. It explicitly initializes the
 * environment for browser usage.
 *
 * @see https://github.com/webdriverio/webdriverio/issues/14598
 */

import { environment, type EnvironmentDependencies } from './environment.js'

/**
 * Explicitly set browser environment values.
 * This ensures deterministic behavior regardless of bundler polyfills.
 */
const browserEnvironment: EnvironmentDependencies = {
    variables: {},
    osType: () => 'browser',
    readFileSync: () => {
        throw new Error('readFileSync is not available in browser environments')
    },
    downloadFile: async () => {
        throw new Error('downloadFile is not available in browser environments')
    },
    savePDF: async () => {
        throw new Error('savePDF is not available in browser environments')
    },
    saveRecordingScreen: async () => {
        throw new Error('saveRecordingScreen is not available in browser environments')
    },
    uploadFile: async () => {
        throw new Error('uploadFile is not available in browser environments')
    },
    saveScreenshot: async () => {
        throw new Error('saveScreenshot is not available in browser environments')
    },
    saveElementScreenshot: async () => {
        throw new Error('saveElementScreenshot is not available in browser environments')
    }
}

// Initialize environment explicitly for browser
environment.value = browserEnvironment

// Re-export everything from the main module
export * from './index.js'
export { remote, attach, multiremote, Key, SevereServiceError } from './index.js'
