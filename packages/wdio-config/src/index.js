import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend } from './utils'
import {
    wrapCommand, runFnInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport, executeSync, executeAsync,
} from './shim'
import { testFnWrapper, runTestInFiberContext } from './test-framework'
import { DEFAULT_CONFIGS } from './constants'

export {
    validateConfig,
    getSauceEndpoint,
    detectBackend,
    ConfigParser,

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
     * constants
     */
    DEFAULT_CONFIGS
}
