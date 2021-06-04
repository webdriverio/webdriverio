/* istanbul ignore file */

import initialisePlugin from './initialisePlugin.js'
import { initialiseWorkerService, initialiseLauncherService } from './initialiseServices.js'
import webdriverMonad from './monad.js'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeRequire,
    isFunctionAsync, transformCommandLogResult, canAccess, sleep
} from './utils.js'
import {
    wrapCommand, runFnInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport, executeSync, executeAsync,
} from './shim.js'
import { testFnWrapper, runTestInFiberContext } from './test-framework/index.js'
import {
    isW3C, capabilitiesEnvironmentDetector,
    sessionEnvironmentDetector, devtoolsEnvironmentDetector
} from './envDetector.js'
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
    safeRequire,
    canAccess,
    sleep,

    /**
     * wdio-sync shim
     */
    wrapCommand,
    executeSync,
    executeAsync,
    runFnInFiberContext,
    runTestInFiberContext,
    testFnWrapper,
    executeHooksWithArgs,
    hasWdioSyncSupport,

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
