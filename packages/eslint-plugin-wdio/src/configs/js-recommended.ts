import plugin from '../plugin.js'
import { sharedGlobals } from '../globals.js'

export default
{
    languageOptions: {
        globals: sharedGlobals,
    },
    plugins: {
        wdio: plugin,
    },
    rules: {
        'wdio/await-expect': 'error',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
    },
}

