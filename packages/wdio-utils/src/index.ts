/* istanbul ignore file */

import initialisePlugin from './initialisePlugin'
import { initialiseWorkerService, initialiseLauncherService } from './initialiseServices'
import webdriverMonad from './monad'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeRequire,
    isFunctionAsync, transformCommandLogResult, canAccess, sleep
} from './utils'
import {
    wrapCommand, runFnInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport, executeSync, executeAsync,
} from './shim'
import { testFnWrapper, runTestInFiberContext } from './test-framework'
import {
    isW3C, capabilitiesEnvironmentDetector,
    sessionEnvironmentDetector, devtoolsEnvironmentDetector
} from './envDetector'

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
    devtoolsEnvironmentDetector
}
