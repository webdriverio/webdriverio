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

    const stopScript = this.isIOS
        ? 'mobile: stopXCTestScreenRecording'
        : this.isAndroid
            ? 'mobile: stopMediaProjectionRecording'
            : undefined

    if (!stopScript) {
        throw new Error(
            'The `saveRecordingScreen` command requires an iOS or Android Appium session. ' +
            'Start recording with the matching driver `mobile:` execute method, then call this command to stop and save.'
        )
    }

    const videoResult = await this.execute(stopScript) as string | { payload?: string, content?: string }
    const videoBase64 = typeof videoResult === 'string'
        ? videoResult
        : videoResult?.payload || videoResult?.content

    if (typeof videoBase64 !== 'string') {
        throw new Error(
            `Unexpected response from \`${stopScript}\`. Expected a base64 string or an object with a payload/content field.`
        )
    }

    const video = Buffer.from(videoBase64, 'base64')
    fs.writeFileSync(absoluteFilepath, video)

    return video
}
