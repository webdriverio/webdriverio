/* istanbul ignore file */

import webdriverMonad from './monad.js'
import { resolveCustomCommandOptions } from './customCommands.js'
import initializePlugin from './initializePlugin.js'
import { startWebDriver } from './startWebDriver.js'
import { initializeLauncherService, initializeWorkerService } from './initializeServices.js'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeImport,
    isFunctionAsync, transformCommandLogResult, sleep, isAppiumCapability,
    userImport, getBrowserObject, enableFileLogging,
} from './utils.js'
import { wrapCommand, executeHooksWithArgs, executeAsync } from './shim.js'
import * as asyncIterators from './pIteration.js'
import { testFnWrapper, wrapGlobalTestMethod } from './test-framework/index.js'
import { isBidi, capabilitiesEnvironmentDetector, sessionEnvironmentDetector } from './envDetector.js'
import { UNICODE_CHARACTERS, HOOK_DEFINITION } from './constants.js'
import { TimingTracker, type TimingMetrics, type TimingPhase } from './profiler.js'

export {
    startWebDriver,
    initializePlugin,
    initializeLauncherService,
    initializeWorkerService,
    isFunctionAsync,
    transformCommandLogResult,
    webdriverMonad,
    resolveCustomCommandOptions,
    commandCallStructure,
    isValidParameter,
    getArgumentType,
    safeImport,
    sleep,
    isAppiumCapability,
    userImport,
    getBrowserObject,
    enableFileLogging,
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
    isBidi,
    sessionEnvironmentDetector,
    capabilitiesEnvironmentDetector,

    /**
     * constants
     */
    UNICODE_CHARACTERS,
    HOOK_DEFINITION,

    /**
     * timing tracker
     */
    TimingTracker,
    type TimingMetrics,
    type TimingPhase
}
