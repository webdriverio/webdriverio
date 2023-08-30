/* istanbul ignore file */

import initialisePlugin from './initialisePlugin.js'
import { initialiseWorkerService, initialiseLauncherService } from './initialiseServices.js'
import webdriverMonad from './monad.js'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeImport,
    isFunctionAsync, transformCommandLogResult, canAccess, sleep
} from './utils.js'
import { wrapCommand, executeHooksWithArgs, executeAsync } from './shim.js'
import { testFnWrapper, wrapGlobalTestMethod } from './test-framework/index.js'
import {
    isW3C, capabilitiesEnvironmentDetector,
    sessionEnvironmentDetector, devtoolsEnvironmentDetector
} from './envDetector.js'
import { startWebDriver } from './driver/index.js'
import { setupDriver, setupBrowser } from './driver/manager.js'
import { UNICODE_CHARACTERS } from './constants.js'

export {
    initialisePlugin,
    initialiseLauncherService,
    initialiseWorkerService,
    isFunctionAsync,
    transformCommandLogResult,
    webdriverMonad,
    commandCallStructure,
    isValidParameter,
    getArgumentType,
    safeImport,
    canAccess,
    sleep,
    startWebDriver,
    setupBrowser,
    setupDriver,

    /**
     * runner shim
     */
    wrapCommand,
    executeAsync,
    wrapGlobalTestMethod,
    testFnWrapper,
    executeHooksWithArgs,

    /**
     * environmentDetector
     */
    isW3C,
    sessionEnvironmentDetector,
    capabilitiesEnvironmentDetector,
    devtoolsEnvironmentDetector,

    /**
     * constants
     */
    UNICODE_CHARACTERS
}
