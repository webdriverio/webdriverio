import ConfigParser from './lib/ConfigParser'
import { validateConfig, detectBackend, initialisePlugin } from './utils'
import { runInFiberContext, wrapCommands, executeHooksWithArgs } from './shim'

export default {
    validateConfig,
    detectBackend,
    initialisePlugin,
    ConfigParser,

    /**
     * wdio-sync shim
     */
    runInFiberContext,
    wrapCommands,
    executeHooksWithArgs
}
