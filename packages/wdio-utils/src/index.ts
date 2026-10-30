/* istanbul ignore file */

import webdriverMonad, { shareCommands } from './monad.js'
import { resolveCustomCommandOptions } from './customCommands.js'
import initializePlugin from './initializePlugin.js'
import { startWebDriver } from './startWebDriver.js'
import { initializeLauncherService, initializeWorkerService } from './initializeServices.js'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeImport,
    isFunctionAsync, transformCommandLogResult, sleep, isAppiumCapability,
    userImport, getBrowserObject, enableFileLogging, specFilePath,
} from './utils.js'
import { wrapCommand, executeHooksWithArgs, executeAsync, chainElementPromise, ELEMENT_ARRAY_WRAP, registerElementArrayFactory, ELEMENT_ARRAY_COMMANDS, setCommandHookStore, unwrapCommand } from './shim.js'
import { setUserCommandStore, registerUserCommands, userCommandParent, runUserCommand, runCustomCommand, runWithoutUserCommands, runOutsideUserCommands, type UserCommandFrame, type UserCommandStore } from './userCommands.js'
import * as asyncIterators from './pIteration.js'
import { testFnWrapper, wrapGlobalTestMethod } from './test-framework/index.js'
import { getCurrentRunnable, setDebugAgentPause } from './test-framework/debugAgent.js'
import { isBidi, capabilitiesEnvironmentDetector, sessionEnvironmentDetector } from './envDetector.js'
import { UNICODE_CHARACTERS, HOOK_DEFINITION } from './constants.js'
import { TimingTracker, type TimingMetrics, type TimingPhase } from './profiler.js'
import {
    WDIO_KIND, WDIO_CHAINABLE, WDIO_KINDS, setWdioKind, getWdioKind, getLoadedWdioKind, isLoadedElement, isArrayOfElements, type WdioKind
} from './kind.js'
import { allocateContext, cleanupAllocation, resolveMaxContexts, type ParallelMode, type ParallelContextAllocation, type ParallelContextBrowser } from './parallel/contexts.js'
import { knownRoles, roleTable, ROLE_SYNONYMS, type AttributeTest, type RoleRule } from './roles.js'

export {
    startWebDriver,
    initializePlugin,
    initializeLauncherService,
    initializeWorkerService,
    isFunctionAsync,
    transformCommandLogResult,
    webdriverMonad,
    shareCommands,
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
    specFilePath,
    asyncIterators,

    /**
     * runner shim
     */
    wrapCommand,
    chainElementPromise,
    ELEMENT_ARRAY_WRAP,
    unwrapCommand,
    ELEMENT_ARRAY_COMMANDS,
    registerElementArrayFactory,
    setCommandHookStore,
    executeAsync,
    wrapGlobalTestMethod,
    testFnWrapper,
    executeHooksWithArgs,
    getCurrentRunnable,
    setDebugAgentPause,

    /**
     * user command events
     */
    setUserCommandStore,
    registerUserCommands,
    userCommandParent,
    runUserCommand,
    runCustomCommand,
    runWithoutUserCommands,
    runOutsideUserCommands,
    type UserCommandFrame,
    type UserCommandStore,

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
    type TimingPhase,

    /**
     * WebdriverIO object brand
     */
    WDIO_KIND,
    WDIO_CHAINABLE,
    WDIO_KINDS,
    setWdioKind,
    getWdioKind,
    getLoadedWdioKind,
    isLoadedElement,
    isArrayOfElements,
    type WdioKind,

    /**
     * implicit ARIA roles from `aria-query`
     */
    roleTable,
    knownRoles,
    ROLE_SYNONYMS,
    type AttributeTest,
    type RoleRule,

    /**
     * BiDi context allocation for parallel test execution
     */
    allocateContext,
    cleanupAllocation,
    resolveMaxContexts,
    type ParallelMode,
    type ParallelContextAllocation,
    type ParallelContextBrowser
}
