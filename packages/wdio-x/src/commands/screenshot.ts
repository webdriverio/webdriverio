import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, getSessionDir, buildAttachOptions } from '../session.js'

export const command = 'screenshot [path]'
export const desc = 'Save a screenshot of the current page'

export const builder = (yargs: Argv) => {
    return yargs.positional('path', {
        type: 'string',
        describe: 'File path to save screenshot (default: ./screenshot-<timestamp>.png)',
    })
}

interface ScreenshotArgs {
    path?: string
    session: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<ScreenshotArgs>) {
    const sessionName = argv.session as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const meta = await readSession(sessionName, sessionsDir)
    if (!meta) {
        console.error(`Error: No active session "${sessionName}". Run wdiox open <url> first.`)
        return
    }

    const browser = await attach(buildAttachOptions(meta))

    const filePath = (argv.path as string) ||
        `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`

    await browser.saveScreenshot(filePath)
    console.log(`Screenshot saved to ${filePath}`)
}
