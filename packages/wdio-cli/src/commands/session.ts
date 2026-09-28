import type { Argv } from 'yargs'

export const command = 'session [action..]'
export const desc = 'Drive a browser, mobile app or desktop app from the shell (see `wdio session --help`)'

/**
 * `@wdio/session` parses its own arguments, including `--help`
 */
export const builder = (yargs: Argv) => {
    return yargs
        .help(false)
        .strict(false)
        .parserConfiguration({ 'unknown-options-as-args': true }) as unknown
}

export const handler = async () => {
    const args = process.argv.slice(2)
    const { runSessionCli } = await import('@wdio/session')
    process.exitCode = await runSessionCli(args.slice(args.indexOf('session') + 1))
}
