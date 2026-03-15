import fs from 'node:fs'
import path from 'node:path'

import { assertDirectoryExists } from './utils.js'

/**
 * Command implementation of the `saveRecordingScreen` command.
 */
export async function saveRecordingScreen (
    this: WebdriverIO.Browser,
    filepath: string
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string') {
        throw new Error('saveRecordingScreen expects a filepath')
    }

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const videoBuffer = await this.stopRecordingScreen()
    const video = Buffer.from(videoBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, video)

    return video
}
