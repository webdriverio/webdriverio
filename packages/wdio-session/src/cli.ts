/**
 * The command-line entry on its own: `wdio session <action>` loads this
 * instead of the whole package, so a single action on a running session
 * does not pay for loading webdriverio.
 */
export { runSessionCli } from './cli/command.js'
