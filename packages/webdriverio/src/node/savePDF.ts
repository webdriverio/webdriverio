import fs from 'node:fs'
import path from 'node:path'

import { assertDirectoryExists } from './utils.js'

type PDFPrintOptions = {
    orientation?: string,
    scale?: number,
    background?: boolean,
    width?: number,
    height?: number,
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
    shrinkToFit?: boolean,
    pageRanges?: Array<string | number>
}

/**
 * Command implementation of the `savePDF` command.
 */
export async function savePDF (
    this: WebdriverIO.Browser,
    filepath: string,
    options?: PDFPrintOptions
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.pdf')) {
        throw new Error('savePDF expects a filepath of type string and ".pdf" file ending')
    }

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const pdf = await this.printPage(options?.orientation, options?.scale, options?.background,
        options?.width, options?.height, options?.top, options?.bottom, options?.left, options?.right,
        options?.shrinkToFit, options?.pageRanges)
    const page = Buffer.from(pdf, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}
