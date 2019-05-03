import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend } from './utils'
import {
    wrapCommand, runFnInFiberContext, runTestInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport
} from './shim'
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
    runFnInFiberContext,
    runTestInFiberContext,
    executeHooksWithArgs,
    hasWdioSyncSupport,

    /**
     * constants
     */
    DEFAULT_CONFIGS
}
