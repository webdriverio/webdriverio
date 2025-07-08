import type fs from 'node:fs'

import type { downloadFile } from './node/downloadFile.js'
import type { savePDF } from './node/savePDF.js'
import type { saveRecordingScreen } from './node/saveRecordingScreen.js'
import type { uploadFile } from './node/uploadFile.js'
import type { saveScreenshot } from './node/saveScreenshot.js'
import type { saveElementScreenshot } from './node/saveElementScreenshot.js'

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version)

export interface EnvironmentVariables {
    DISABLE_WEBDRIVERIO_DEPRECATION_WARNINGS?: string
    WDIO_UNIT_TESTS?: string
    WDIO_WORKER_ID?: string
}

export interface EnvironmentDependencies {
    variables: EnvironmentVariables
    readFileSync: typeof fs.readFileSync
    downloadFile: typeof downloadFile,
    savePDF: typeof savePDF,
    saveRecordingScreen: typeof saveRecordingScreen,
    uploadFile: typeof uploadFile,
    saveScreenshot: typeof saveScreenshot,
    saveElementScreenshot: typeof saveElementScreenshot
    osType: () => string
}

/**
 * Holder for environment dependencies. These dependencies cannot
 * be used during the module instantiation.
 */
export const environment: {
    value: EnvironmentDependencies;
} = {
    value: {
        get readFileSync(): EnvironmentDependencies['readFileSync'] {
            throw new Error('Can\'t read files form file system in this environment')
        },
        get downloadFile(): EnvironmentDependencies['downloadFile'] {
            throw new Error('The `downloadFile` command is not available in this environment')
        },
        get savePDF(): EnvironmentDependencies['savePDF'] {
            throw new Error('The `savePDF` command is not available in this environment')
        },
        get saveRecordingScreen(): EnvironmentDependencies['saveRecordingScreen'] {
            throw new Error('The `saveRecordingScreen` command is not available in this environment')
        },
        get uploadFile(): EnvironmentDependencies['uploadFile'] {
            throw new Error('The `uploadFile` command is not available in this environment')
        },
        get saveScreenshot(): EnvironmentDependencies['saveScreenshot'] {
            throw new Error('The `saveScreenshot` command for WebdriverIO.Browser is not available in this environment')
        },
        get saveElementScreenshot(): EnvironmentDependencies['saveElementScreenshot'] {
            throw new Error('The `saveScreenshot` command for WebdriverIO.Element is not available in this environment')
        },
        get osType() {
            return () => 'browser'
        },
        get variables() {
            /**
             * In unit tests we need to use the process.env object to set the environment variables.
             */
            return isNode ? process.env as EnvironmentVariables : {} as EnvironmentVariables
        }
    }
}
