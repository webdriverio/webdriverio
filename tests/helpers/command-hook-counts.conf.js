import { config as baseConfig } from './config.js'

/**
 * records the name of each command hook, for the spec to check
 */
export const config = Object.assign({}, baseConfig, {
    beforeCommand (commandName) {
        (globalThis.commandHooks ??= []).push(`before ${commandName}`)
    },
    afterCommand (commandName) {
        (globalThis.commandHooks ??= []).push(`after ${commandName}`)
    }
})
