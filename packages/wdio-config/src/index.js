import ConfigParser from './lib/ConfigParser'
import { validateConfig, getSauceEndpoint, detectBackend, initialisePlugin } from './utils'
import {
    wrapCommand, runFnInFiberContext, runTestInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport
} from './shim'

export {
    validateConfig,
    getSauceEndpoint,
    detectBackend,
    initialisePlugin,
    ConfigParser,

    /**
     * wdio-sync shim
     */
    wrapCommand,
    runFnInFiberContext,
    runTestInFiberContext,
    executeHooksWithArgs,
    hasWdioSyncSupport
}
