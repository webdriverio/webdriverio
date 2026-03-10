import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, deleteSessionFiles, getSessionDir, buildAttachOptions } from '../session.js'

export const command = 'session-stop <name>'
export const desc = 'Stop and clean up a named session'

export const builder = (yargs: Argv) => {
    return yargs.positional('name', {
        type: 'string',
        describe: 'Session name to stop',
    })
}

interface SessionStopArgs {
    name: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<SessionStopArgs>) {
    const sessionName = argv.name as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const meta = await readSession(sessionName, sessionsDir)
    if (!meta) {
        console.error(`Error: No session "${sessionName}" found.`)
        return
    }

    try {
        const browser = await attach(buildAttachOptions(meta))
        await browser.deleteSession()
    } catch {
        // Already dead
    }

    await deleteSessionFiles(sessionName, sessionsDir)
    console.log(`Session "${sessionName}" stopped.`)
}
