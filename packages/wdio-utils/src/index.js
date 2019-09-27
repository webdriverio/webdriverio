import initialisePlugin from './initialisePlugin'
import initialiseServices from './initialiseServices'
import webdriverMonad from './monad'
import {
    commandCallStructure, isValidParameter, getArgumentType, safeRequire
} from './utils'
import {
    wrapCommand, runFnInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport, executeSync, executeAsync,
} from './shim'
import { testFnWrapper, runTestInFiberContext } from './test-framework'

export {
    initialisePlugin,
    initialiseServices,
    webdriverMonad,
    commandCallStructure,
    isValidParameter,
    getArgumentType,
    safeRequire,

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
    hasWdioSyncSupport
}
