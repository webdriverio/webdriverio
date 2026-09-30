import fs from 'node:fs'
import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'

import { getContextManager } from '../session/context.js'
import type { PDFPrintOptions } from '../types.js'
import { assertDirectoryExists } from './utils.js'

/**
 * Command implementation of the `savePDF` command.
 *
 * BiDi sessions render with `browsingContext.print`. Classic sessions keep
 * `printPage`. BiDi receives only the fields the caller set, so the browser
 * keeps its defaults for the rest. A BiDi `unsupported operation` error is
 * not caught and is not retried with `printPage`.
 */
export async function savePDF (
    this: WebdriverIO.Browser,
    filepath: string,
    options?: PDFPrintOptions | null
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.pdf')) {
        throw new Error('savePDF expects a filepath of type string and ".pdf" file ending')
    }

    /**
     * A JavaScript caller can pass `null`. Default parameters only replace
     * `undefined`, so normalize before either print path reads the object.
     */
    const printOptions: PDFPrintOptions = options ?? {}
    assertOrientation(printOptions.orientation)

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const base64 = this.isBidi
        ? await printBidi.call(this, printOptions)
        : await printClassic.call(this, printOptions)
    const page = Buffer.from(base64, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}

function assertOrientation (orientation: string | undefined): 'portrait' | 'landscape' | undefined {
    if (orientation === undefined) {
        return undefined
    }
    if (orientation !== 'portrait' && orientation !== 'landscape') {
        throw new Error(`savePDF expects orientation to be "portrait" or "landscape", received "${orientation}"`)
    }
    return orientation
}

/**
 * Classic `printPage` keeps the positional arguments it has always received.
 * Undefined options stay in place so the driver omits them from the body.
 */
function printClassic (this: WebdriverIO.Browser, options?: PDFPrintOptions) {
    return this.printPage(
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
        options?.pageRanges
    )
}

/**
 * Render the current top-level browsing context with `browsingContext.print`.
 * The result payload is `{ data }` base64, same as classic `printPage`.
 */
async function printBidi (this: WebdriverIO.Browser, options?: PDFPrintOptions) {
    const browser = getBrowserObject(this)
    const context = await topLevelBrowsingContext(browser)
    const { data } = await this.browsingContextPrint(toPrintParameters(context, options))
    return data
}

/**
 * `browsingContext.print` rejects a non-top-level context. Walk from the
 * context manager's current context to the root of the browsing-context tree.
 */
async function topLevelBrowsingContext (browser: WebdriverIO.Browser) {
    const contextManager = getContextManager(browser)
    let context = await contextManager.getCurrentContext()
    const { contexts } = await browser.browsingContextGetTree({})
    let parent = contextManager.findParentContext(context, contexts)
    const seen = new Set<string>()
    while (parent && !seen.has(parent.context)) {
        seen.add(context)
        context = parent.context
        parent = contextManager.findParentContext(context, contexts)
    }
    return context
}

/**
 * Map `PDFPrintOptions` onto `browsingContext.print` without renaming fields.
 * Skip empty `page` and `margin` objects when none of those fields were set.
 */
function toPrintParameters (
    context: string,
    options?: PDFPrintOptions | null
): remote.BrowsingContextPrintParameters {
    /**
     * `null` does not trigger the default parameter, and reading
     * `options.orientation` would throw. Treat it as omitted options.
     */
    const printOptions: PDFPrintOptions = options ?? {}
    const params: remote.BrowsingContextPrintParameters = { context }
    const orientation = assertOrientation(printOptions.orientation)

    if (orientation !== undefined) {
        params.orientation = orientation
    }
    if (printOptions.scale !== undefined) {
        params.scale = printOptions.scale
    }
    if (printOptions.background !== undefined) {
        params.background = printOptions.background
    }
    if (printOptions.shrinkToFit !== undefined) {
        params.shrinkToFit = printOptions.shrinkToFit
    }
    if (printOptions.pageRanges !== undefined) {
        params.pageRanges = printOptions.pageRanges
    }

    const page: remote.BrowsingContextPrintPageParameters = {}
    if (printOptions.width !== undefined) {
        page.width = printOptions.width
    }
    if (printOptions.height !== undefined) {
        page.height = printOptions.height
    }
    if (printOptions.width !== undefined || printOptions.height !== undefined) {
        params.page = page
    }

    const margin: remote.BrowsingContextPrintMarginParameters = {}
    if (printOptions.top !== undefined) {
        margin.top = printOptions.top
    }
    if (printOptions.bottom !== undefined) {
        margin.bottom = printOptions.bottom
    }
    if (printOptions.left !== undefined) {
        margin.left = printOptions.left
    }
    if (printOptions.right !== undefined) {
        margin.right = printOptions.right
    }
    if (
        printOptions.top !== undefined ||
        printOptions.bottom !== undefined ||
        printOptions.left !== undefined ||
        printOptions.right !== undefined
    ) {
        params.margin = margin
    }

    return params
}
