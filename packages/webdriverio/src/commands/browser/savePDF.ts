import fs from 'node:fs'
import { getAbsoluteFilepath, assertDirectoryExists } from '../../utils/index.js'

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
    pageRanges?: object[]
}

/**
 *
 * Prints the page of the current browsing context to a PDF file on your OS.
 *
 * <example>
    :savePDF.js
    it('should save a PDF screenshot of the browser view', function () {
        await browser.savePDF('./some/path/screenshot.pdf');
    });
 * </example>
 *
 * @alias browser.savePDF
 * @param   {String}           filepath              path to the generated pdf (`.pdf` suffix is required) relative to the execution directory
 * @param   {PDFPrintOptions=} options              Print PDF Options
 * @param   {String=}          options.orientation  Orientation of PDF page
 * @param   {number=}          options.scale        Scale of PDF page
 * @param   {boolean=}         options.background   Include background of PDF page
 * @param   {number=}          options.width        Width of PDF page
 * @param   {number=}          options.height       Height of PDF page
 * @param   {number=}          options.top          Top padding of PDF page
 * @param   {number=}          options.bottom       Bottom padding of PDF page
 * @param   {number=}          options.left         Left padding of PDF page
 * @param   {number=}          options.right        Right padding of PDF page
 * @param   {boolean=}         options.shrinkToFit  Shrink page to fit page
 * @param   {object[]}         options.pageRanges   Range of pages to include in PDF
 * @return  {Buffer}   screenshot buffer
 * @type utility
 *
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

    const pdf = await this.printPage(options?.orientation, options?.scale, options?.background,
        options?.width, options?.height, options?.top, options?.bottom, options?.left, options?.right,
        options?.shrinkToFit, options?.pageRanges)
    const page = Buffer.from(pdf, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}
