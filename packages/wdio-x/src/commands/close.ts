import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, deleteSessionFiles, getSessionDir, buildAttachOptions } from '../session.js'

export const command = 'close'
export const desc = 'Close the browser session'

export const builder = (yargs: Argv) => yargs

interface CloseArgs {
    session: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<CloseArgs>) {
    const sessionName = argv.session as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const meta = await readSession(sessionName, sessionsDir)
    if (!meta) {
        console.error(`Error: No active session "${sessionName}". Run wdiox open <url> first.`)
        return
    }

    try {
        const browser = await attach(buildAttachOptions(meta))
        await browser.deleteSession()
    } catch {
        // Session may already be dead - clean up anyway
    }

    await deleteSessionFiles(sessionName, sessionsDir)
    console.log(`Session "${sessionName}" closed.`)
}
