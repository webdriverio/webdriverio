import { savePDF as savePDFBrowser } from '../browser/savePDF.js'

/**
 *
 * Prints the page of the current browsing context to a PDF file on your OS.
 *
 * <example>
    :savePDF.js
    it('should save a PDF screenshot of the browser view', function () {
        const context = await browser.url('https://webdriver.io')
        await context.savePDF('./some/path/screenshot.pdf');
    });
 * </example>
 *
 * @alias browser.savePDF
 * @param   {String}           filepath              path to the generated pdf (`.pdf` suffix is required) relative to the execution directory
 * @param   {PDFPrintOptions=} options              Print PDF Options
 * @param   {String=}          options.orientation  Orientation of PDF page, either `portrait` or `landscape`
 * @param   {number=}          options.scale        Scale of PDF page
 * @param   {boolean=}         options.background   Include background of PDF page
 * @param   {number=}          options.width        Width of PDF page
 * @param   {number=}          options.height       Height of PDF page
 * @param   {number=}          options.top          Top padding of PDF page
 * @param   {number=}          options.bottom       Bottom padding of PDF page
 * @param   {number=}          options.left         Left padding of PDF page
 * @param   {number=}          options.right        Right padding of PDF page
 * @param   {boolean=}         options.shrinkToFit  Shrink page to fit page
 * @param   {number[]}         options.pageRanges   Range of pages to include in PDF
 * @return  {Buffer}   screenshot buffer
 * @type utility
 *
 */
export const savePDF = savePDFBrowser
