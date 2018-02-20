import ConfigParser from './lib/ConfigParser'
import { validateConfig, detectBackend, initialisePlugin } from './utils'
import {
    wrapCommand, runFnInFiberContext, runTestInFiberContext, executeHooksWithArgs,
    hasWdioSyncSupport
} from './shim'

export default {
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
