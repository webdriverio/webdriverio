import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, getSessionDir, getRefsPath, buildAttachOptions } from '../session.js'
import { lookupRef } from '../refs.js'

export const command = 'click <ref>'
export const desc = 'Click an element by snapshot reference (e.g., e1)'

export const builder = (yargs: Argv) => {
    return yargs.positional('ref', {
        type: 'string',
        describe: 'Element reference from snapshot (e.g., e1, a3)',
    })
}

interface ClickArgs {
    ref: string
    session: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<ClickArgs>) {
    const sessionName = argv.session as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const meta = await readSession(sessionName, sessionsDir)
    if (!meta) {
        console.error(`Error: No active session "${sessionName}". Run wdiox open <url> first.`)
        return
    }

    const refKey = argv.ref as string
    const result = await lookupRef(getRefsPath(sessionName, sessionsDir), refKey)
    if (!result) {
        return
    }

    const browser = await attach(buildAttachOptions(meta))

    try {
        await browser.$(result.selector).click()
        console.log(`Clicked ${refKey} (${result.ref.tagName})`)
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Error clicking ${refKey}: ${msg}`)
    }
}
