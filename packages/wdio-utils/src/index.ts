/* istanbul ignore file */

import { UNICODE_CHARACTERS } from './constants.js'
import {
    capabilitiesEnvironmentDetector,
    devtoolsEnvironmentDetector,
    isW3C,
    sessionEnvironmentDetector,
} from './envDetector.js'
import initialisePlugin from './initialisePlugin.js'
import {
    initialiseLauncherService,
    initialiseWorkerService,
} from './initialiseServices.js'
import webdriverMonad from './monad.js'
import { executeAsync, executeHooksWithArgs, wrapCommand } from './shim.js'
import { runTestInFiberContext, testFnWrapper } from './test-framework/index.js'
import {
    canAccess,
    commandCallStructure,
    getArgumentType,
    isFunctionAsync,
    isValidParameter,
    safeImport,
    sleep,
    transformCommandLogResult,
} from './utils.js'

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

    /**
     * runner shim
     */
    wrapCommand,
    executeAsync,
    runTestInFiberContext,
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
    UNICODE_CHARACTERS,
}
