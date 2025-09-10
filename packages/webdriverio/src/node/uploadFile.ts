import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

/**
 * Command implementation of the `saveRecordingScreen` command.
 */
export async function uploadFile (
    this: WebdriverIO.Browser,
    localPath: string
): Promise<string> {
    /**
     * parameter check
     */
    if (typeof localPath !== 'string') {
        throw new Error('number or type of arguments don\'t agree with uploadFile command')
    }

    /**
     * check if command is available
     */
    if (typeof this.file !== 'function') {
        throw new Error(`The uploadFile command is not available in ${(this.capabilities as WebdriverIO.Capabilities).browserName}`)
    }

    const zipData: Uint8Array[] = []
    const source = fs.createReadStream(localPath)

    return new Promise((resolve, reject) => {
        archiver('zip')
            .on('error', (err: Error) => reject(err))
            .on('data', (data: Uint8Array) => zipData.push(data))
            .on('end', () => (
                this.file(Buffer.concat(zipData).toString('base64'))
                    .then((localPath) => resolve(localPath), reject)
            ))
            .append(source, { name: path.basename(localPath) })
            .finalize()
    })
}
