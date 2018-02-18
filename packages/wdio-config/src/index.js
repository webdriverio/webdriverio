import ConfigParser from './lib/ConfigParser'
import { validateConfig, detectBackend, initialisePlugin } from './utils'
import { wrapCommand, runInFiberContext, executeHooksWithArgs } from './shim'

export default {
    validateConfig,
    detectBackend,
    initialisePlugin,
    ConfigParser,

    /**
     * wdio-sync shim
     */
    wrapCommand,
    runInFiberContext,
    executeHooksWithArgs
}
