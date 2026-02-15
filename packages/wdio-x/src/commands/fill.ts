import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, getSessionDir, getRefsPath, buildAttachOptions } from '../session.js'
import { lookupRef } from '../refs.js'

export const command = 'fill <ref> <text>'
export const desc = 'Clear and type text into an input element by snapshot reference'

export const builder = (yargs: Argv) => {
    return yargs
        .positional('ref', {
            type: 'string',
            describe: 'Element reference from snapshot (e.g., e1)',
        })
        .positional('text', {
            type: 'string',
            describe: 'Text to type',
        })
}

interface FillArgs {
    ref: string
    text: string
    session: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<FillArgs>) {
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
        const element = await browser.$(result.selector)
        await element.clearValue()
        await element.addValue(argv.text as string)
        console.log(`Filled ${refKey} with "${argv.text}"`)
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Error: ${refKey} not found on page — the page may have changed. Run wdiox snapshot to refresh.\n${msg}`)
    }
}
