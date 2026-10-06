/** `command`: action name ('snapshot', 'frame', 'tabs', …) or CLI-only ('open', 'close', 'help', 'doctor'); `args`: action-args shape (positional names, camelCase options), '<…>' strings are placeholders. Return undefined to keep the CLI text. */
export type HintFormatter = (command: string, args?: Record<string, unknown>) => string | undefined
export type Cmd = (command: string, args: Record<string, unknown> | undefined, cli: string) => string

export const cliCmd: Cmd = (_command, _args, cli) => cli

export function cmdWith (format?: HintFormatter): Cmd {
    if (!format) {
        return cliCmd
    }
    return (command, args, cli) => {
        try {
            return format(command, args) ?? cli
        } catch {
            return cli
        }
    }
}
