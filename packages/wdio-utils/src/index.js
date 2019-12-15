import initialisePlugin from './initialisePlugin'
import initialiseServices from './initialiseServices'
import webdriverMonad from './monad'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeRequire,
    isFunctionAsync
} from './utils'
import { wrapCommand, executeHooksWithArgs } from './shim'
import { testFnWrapper, runTestInFiberContext } from './test-framework'
import { capabilitiesEnvironmentDetector, sessionEnvironmentDetector, devtoolsEnvironmentDetector } from './envDetector'

export {
    initialisePlugin,
    initialiseServices,
    isFunctionAsync,
    webdriverMonad,
    commandCallStructure,
    isValidParameter,
    getArgumentType,
    safeRequire,

    /**
     * wdio-sync shim
     */
    wrapCommand,
    executeHooksWithArgs,
    runTestInFiberContext,
    testFnWrapper,

    /**
     * environmentDetector
     */
    sessionEnvironmentDetector,
    capabilitiesEnvironmentDetector,
    devtoolsEnvironmentDetector
}
