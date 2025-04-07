import fs from 'node:fs'

import { getBrowserObject } from '@wdio/utils'

import { getAbsoluteFilepath, assertDirectoryExists } from './utils.js'
import { isBrowsingContext } from '../utils/index.js'

type PDFPrintOptions = {
    orientation?: 'portrait' | 'landscape',
    scale?: number,
    background?: boolean,
    width?: number,
    height?: number,
    top?: number,
    bottom?: number,
    left?: number,
    right?: number,
    shrinkToFit?: boolean,
    pageRanges?: number[]
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

    const absoluteFilepath = getAbsoluteFilepath(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const browser = getBrowserObject(this)
    const result = isBrowsingContext(this)
        ? await browser.browsingContextPrint({
            context: this.contextId,
            background: options?.background,
            margin: {
                top: options?.top,
                bottom: options?.bottom,
                left: options?.left,
                right: options?.right
            },
            orientation: options?.orientation,
            page: {
                width: options?.width,
                height: options?.height
            },
            pageRanges: options?.pageRanges,
            scale: options?.scale,
            shrinkToFit: options?.shrinkToFit
        })
        : await this.printPage(
            options?.orientation,
            options?.scale,
            options?.background,
            options?.width,
            options?.height,
            options?.top,
            options?.bottom,
            options?.left,
            options?.right,
            options?.shrinkToFit,
            options?.pageRanges as unknown as object[]
        )

    const pdf = typeof result === 'string' ? result : result.data
    const page = Buffer.from(pdf, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}
