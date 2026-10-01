import { environment } from '../../environment.js'
import type { PDFPrintOptions } from '../../types.js'

/**
 * Prints the page of the current browsing context to a PDF file on your OS.
 *
 * `savePDF(filepath, options?)` writes the PDF and returns the same bytes as a `Buffer`.
 * `filepath` is resolved from the execution directory and must end with `.pdf`.
 *
 * A WebDriver BiDi session (`browser.isBidi`) renders the PDF with
 * [`browsingContext.print`](https://w3c.github.io/webdriver-bidi/#command-browsingContext-print).
 * That is how Chrome, Edge, and Firefox print, headed and headless. Headed and headless Chrome
 * both return a non-empty PDF on this path. Only options you set are sent, so the browser keeps
 * its defaults for the rest. `context` is the current top-level browsing context. If the browser
 * rejects the command with `unsupported operation`, that error is returned as-is. The command
 * does not fall back to Classic `printPage`.
 *
 * A WebDriver Classic session renders the PDF with
 * [`printPage`](https://w3c.github.io/webdriver/#print-page). Chrome's Classic endpoint was
 * limited to [headless mode](/docs/capabilities/#run-browser-headless)
 * ([crbug 753118](https://bugs.chromium.org/p/chromium/issues/detail?id=753118)).
 * That limit is specific to Classic `printPage`. Current Chrome can also print from a headed
 * Classic session; an older Chrome that still refuses it should use a BiDi session or run
 * Classic Chrome headless.
 *
 * Lengths are centimeters. Defaults match both protocols: `portrait`, scale `1`, background
 * `false`, shrink-to-fit `true`, page `21.59` × `27.94` cm, and margins of `1` cm.
 * `pageRanges` entries are page numbers or range strings such as `'1-3'`.
 *
 * <example>
    :savePDF.js
    it('should save a PDF of the browser view', async () => {
        const pdf = await browser.savePDF('./some/path/page.pdf');
        console.log(pdf.subarray(0, 5).toString()); // outputs: "%PDF-"
    });

    it('should save a landscape PDF with a custom margin', async () => {
        await browser.savePDF('./some/path/landscape.pdf', {
            orientation: 'landscape',
            left: 2
        });
    });
 * </example>
 *
 * @alias browser.savePDF
 * @param   {string}            filepath                 path to the generated PDF (`.pdf` suffix is required) relative to the execution directory
 * @param   {PDFPrintOptions=}  options                  print options, in centimeters
 * @param   {string=}           options.orientation      page orientation: `portrait` or `landscape`. Default: `portrait`
 * @param   {number=}           options.scale            page scale from `0.1` to `2`. Default: `1`
 * @param   {boolean=}          options.background       include the page background. Default: `false`
 * @param   {number=}           options.width            page width in cm. Default: `21.59`
 * @param   {number=}           options.height           page height in cm. Default: `27.94`
 * @param   {number=}           options.top              top margin in cm. Default: `1`
 * @param   {number=}           options.bottom           bottom margin in cm. Default: `1`
 * @param   {number=}           options.left             left margin in cm. Default: `1`
 * @param   {number=}           options.right            right margin in cm. Default: `1`
 * @param   {boolean=}          options.shrinkToFit      shrink the page to fit. Default: `true`
 * @param   {Array<string|number>=} options.pageRanges   pages to include, as numbers or range strings such as `'1-3'`. Default: `[]`
 * @return  {Buffer}  PDF buffer
 * @throws  {Error}  if `filepath` is not a string ending in `.pdf`, or if `orientation` is not `portrait` or `landscape`
 * @type utility
 *
 */
export async function savePDF (
    this: WebdriverIO.Browser,
    filepath: string,
    options?: PDFPrintOptions
): Promise<Buffer<ArrayBuffer>> {
    /**
     * run command implementation based on given environment
     */
    return environment.value.savePDF.call(this, filepath, options)
}
