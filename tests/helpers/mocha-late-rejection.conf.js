import { config as baseConfig } from './config.js'

// rejects the promise of the last afterEach hook after the Mocha run
export const config = Object.assign({}, baseConfig, {
    after: () => globalThis.rejectLateCommand(new Error('late rejection'))
})
