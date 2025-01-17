import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'
import logger from '@wdio/logger'

const log = logger('webdriverio')

/**
 * Command implementation of the `downloadFile` command.
 */
export async function downloadFile(
    this: WebdriverIO.Browser,
    fileName: string,
    targetDirectory: string
): Promise<object> {
    /**
     * parameter check
     */
    if (typeof fileName !== 'string' || typeof targetDirectory !== 'string') {
        throw new Error('number or type of arguments don\'t agree with downloadFile command')
    }

    /**
     * check if command is available
     */
    if (typeof this.download !== 'function') {
        throw new Error(`The downloadFile command is not available in ${(this.capabilities as WebdriverIO.Capabilities).browserName} and only available when using Selenium Grid`)
    }

    const response = await this.download(fileName)
    const base64Content = response.contents

    if (!targetDirectory.endsWith('/')) {
        targetDirectory += '/'
    }

    fs.mkdirSync(targetDirectory, { recursive: true })
    const zipFilePath = path.join(targetDirectory, `${fileName}.zip`)
    const binaryString = atob(base64Content as string)
    const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0))
    fs.writeFileSync(zipFilePath, bytes)

    const zipData = fs.readFileSync(zipFilePath)
    const filesData: string[] = []

    try {
        const zip = await JSZip.loadAsync(zipData)
        const keys = Object.keys(zip.files)

        // Iterate through each file in the zip archive
        for (let i = 0; i < keys.length; i++) {
            const fileData = await zip.files[keys[i]].async('nodebuffer')
            const dir = path.resolve(targetDirectory, keys[i])
            fs.writeFileSync(dir, fileData)
            log.info(`File extracted: ${keys[i]}`)
            filesData.push(dir)
        }
    } catch (error) {
        log.error('Error unzipping file:', error)
    }

    return Promise.resolve({
        files: filesData
    })
}
