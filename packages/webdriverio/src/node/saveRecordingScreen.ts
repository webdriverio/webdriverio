import fs from 'node:fs'

import { getAbsoluteFilepath, assertDirectoryExists } from './utils.js'

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

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const videoBuffer = await this.stopRecordingScreen()
    const video = Buffer.from(videoBuffer, 'base64')
    fs.writeFileSync(absoluteFilepath, video)

    return video
}
