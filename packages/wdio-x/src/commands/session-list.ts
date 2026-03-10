import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { listSessions, getSessionDir, deleteSessionFiles, buildAttachOptions } from '../session.js'
import { formatSessionList, type SessionListEntry } from '../format.js'

export const command = 'session-list'
export const desc = 'List all active sessions'

export const builder = (yargs: Argv) => yargs

interface SessionListArgs {
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<SessionListArgs>) {
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()
    const sessions = await listSessions(sessionsDir)

    if (sessions.length === 0) {
        console.log(' No active sessions.')
        return
    }

    const entries: SessionListEntry[] = []

    for (const session of sessions) {
        let status = 'active'
        try {
            const browser = await attach(buildAttachOptions(session.metadata))
            await browser.getPageSource()
        } catch {
            status = 'expired'
            await deleteSessionFiles(session.name, sessionsDir)
        }

        const caps = session.metadata.capabilities
        const browserName = (caps.browserName as string)
            || (caps.platformName as string)
            || 'unknown'
        entries.push({
            name: session.name,
            browser: browserName,
            url: session.metadata.url,
            status,
        })
    }

    console.log(formatSessionList(entries))
}
