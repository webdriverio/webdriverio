/* istanbul ignore file */

import webdriverMonad from './monad.js'
import initializePlugin from './initializePlugin.js'
import { startWebDriver } from './startWebDriver.js'
import { initializeWorkerService, initializeLauncherService } from './initializeServices.js'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeImport,
    isFunctionAsync, transformCommandLogResult, sleep, isAppiumCapability,
    userImport
} from './utils.js'
import { wrapCommand, executeHooksWithArgs, executeAsync } from './shim.js'
import * as asyncIterators from './pIteration.js'
import { testFnWrapper, wrapGlobalTestMethod } from './test-framework/index.js'
import { isW3C, capabilitiesEnvironmentDetector, sessionEnvironmentDetector } from './envDetector.js'
import { UNICODE_CHARACTERS, HOOK_DEFINITION } from './constants.js'

export {
    startWebDriver,
    initializePlugin,
    initializeLauncherService,
    initializeWorkerService,
    isFunctionAsync,
    transformCommandLogResult,
    webdriverMonad,
    commandCallStructure,
    isValidParameter,
    getArgumentType,
    safeImport,
    sleep,
    isAppiumCapability,
    userImport,
    asyncIterators,

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

    /**
     * constants
     */
    UNICODE_CHARACTERS,
    HOOK_DEFINITION
}
