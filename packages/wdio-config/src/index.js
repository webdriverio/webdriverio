import ConfigParser from './lib/ConfigParser'
import { validateConfig, detectBackend, initialisePlugin } from './utils'
import {
    wrapCommand, runFnInFiberContext, runTestInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport
} from './shim'

export {
    validateConfig,
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
