import fs from 'node:fs'
import path from 'node:path'

import { getBrowserObject } from '@wdio/utils'
import type { remote } from 'webdriver'

import { getContextManager } from '../session/context.js'
import type { PDFPrintOptions } from '../types.js'
import { assertDirectoryExists } from './utils.js'

const PDF_ORIENTATIONS = ['portrait', 'landscape'] as const

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
    options?: PDFPrintOptions
) {
    /**
     * type check
     */
    if (typeof filepath !== 'string' || !filepath.endsWith('.pdf')) {
        throw new Error('savePDF expects a filepath of type string and ".pdf" file ending')
    }

    assertOrientation(options?.orientation)

    const absoluteFilepath = path.resolve(filepath)
    await assertDirectoryExists(absoluteFilepath)

    const base64 = this.isBidi
        ? await printBidi.call(this, options)
        : await printClassic.call(this, options)
    const page = Buffer.from(base64, 'base64')
    fs.writeFileSync(absoluteFilepath, page)

    return page
}

function assertOrientation (orientation: PDFPrintOptions['orientation']) {
    if (orientation !== undefined && !(PDF_ORIENTATIONS as readonly string[]).includes(orientation)) {
        throw new Error(`savePDF expects orientation to be "portrait" or "landscape", received "${String(orientation)}"`)
    }
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
    options: PDFPrintOptions = {}
): remote.BrowsingContextPrintParameters {
    const params: remote.BrowsingContextPrintParameters = { context }

    if (options.orientation !== undefined) {
        params.orientation = options.orientation
    }
    if (options.scale !== undefined) {
        params.scale = options.scale
    }
    if (options.background !== undefined) {
        params.background = options.background
    }
    if (options.shrinkToFit !== undefined) {
        params.shrinkToFit = options.shrinkToFit
    }
    if (options.pageRanges !== undefined) {
        params.pageRanges = options.pageRanges
    }

    const page: remote.BrowsingContextPrintPageParameters = {}
    if (options.width !== undefined) {
        page.width = options.width
    }
    if (options.height !== undefined) {
        page.height = options.height
    }
    if (options.width !== undefined || options.height !== undefined) {
        params.page = page
    }

    const margin: remote.BrowsingContextPrintMarginParameters = {}
    if (options.top !== undefined) {
        margin.top = options.top
    }
    if (options.bottom !== undefined) {
        margin.bottom = options.bottom
    }
    if (options.left !== undefined) {
        margin.left = options.left
    }
    if (options.right !== undefined) {
        margin.right = options.right
    }
    if (
        options.top !== undefined ||
        options.bottom !== undefined ||
        options.left !== undefined ||
        options.right !== undefined
    ) {
        params.margin = margin
    }

    return params
}
