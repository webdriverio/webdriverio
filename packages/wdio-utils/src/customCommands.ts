import type { CustomCommands } from '@wdio/types'

/**
 * `addCommand` and `overwriteCommand` only accept an options object as the
 * third argument. A boolean is the v9 positional form and is rejected.
 */
export function resolveCustomCommandOptions(
    commandName: 'addCommand' | 'overwriteCommand',
    options?: unknown
): CustomCommands.CustomCommandOptions<boolean> {
    if (options === undefined || options === null) {
        return {}
    }

    if (typeof options === 'boolean') {
        throw new Error(
            `Passing a boolean as the third argument to \`${commandName}\` was removed in WebdriverIO v10. ` +
            `Use \`${commandName}(name, fn, { attachToElement: ${options} })\`.`
        )
    }

    if (typeof options !== 'object') {
        throw new Error(`The third argument to \`${commandName}\` must be an options object.`)
    }

    return options
}
