import { ELEMENT_KEY } from 'webdriver'
import type * as WebDriverTypes from 'webdriver'

import { isStub } from '../index.js'
import { getContextManager } from '../../session/context.js'
import { environment } from '../../environment.js'
import { nameStaleElement, withKnownElement } from '../foreignContext.js'
import { isBidiCommandsEnabled } from './elementCommands.js'
import { executeInContext } from './index.js'

const overwrittenBrowsers = new WeakSet<WebdriverIO.Browser>()

/**
 * Install Bidi-aware overwrites for protocol commands that need Bidi-specific
 * mechanisms.  Each overwrite checks `isBidiCommandsEnabled(this)` at call time:
 * the Bidi path uses a Bidi-only API (script.evaluate, browsingContext.getTree),
 * while the non-Bidi fallback calls `origCommand()` — the untouched protocol
 * endpoint — so mock services and classic WebDriver keep working without any
 * changes.
 *
 * The `isBidiCommandsEnabled` gate requires both `browser.isBidi` AND the
 * `'wdio:experimentalBiDiCommands': true` capability flag.  Mock sessions
 * (which are Bidi-capable but don't set the experimental flag) fall through
 * to the classic `origCommand()` path.
 *
 * Centralising these overwrites here (rather than in separate command files)
 * makes it easier to spot and manage Bidi-vs-classic inconsistencies across
 * browser-level getters.
 */
export function applyBidiBrowserOverwrites(browser: WebdriverIO.Browser) {
    /**
     * Skip in unit tests — the browser object is a Vitest mock without a real
     * session, overwriteCommand chain, or ContextManager backing store.
     */
    if (environment.value.variables.WDIO_UNIT_TESTS) {
        return
    }

    /**
     * Skip protocol-stub sessions (e.g. the runner's capability-filtering
     * pass which sets `automationProtocol: './protocol-stub.js'`).  The
     * runner transfers the stub's `overwrittenCommands` onto the real
     * browser, so closures registered here must not capture the stub's
     * ContextManager — hence the call-time `getContextManager(this)`
     * resolution below (same pattern as the `url` command).
     */
    if (isStub((browser.options as { automationProtocol?: string } | undefined)?.automationProtocol)) {
        return
    }

    /**
     * Without the flag every overwrite would only add a second wrapCommand
     * layer (double command events) around the original command.
     */
    if (!isBidiCommandsEnabled(browser) || overwrittenBrowsers.has(browser)) {
        return
    }
    overwrittenBrowsers.add(browser)

    const overwrite = browser.overwriteCommand.bind(browser) as (name: string, fn: Function) => void

    overwrite('getTitle', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const result = await this.scriptEvaluate({
                expression: 'document.title',
                target: { context },
                awaitPromise: false
            })
            return (result as { result: { value: string } }).result?.value || ''
        }
        return origCommand()
    })

    overwrite('getUrl', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const tree = await this.browsingContextGetTree({ root: context })
            return tree.contexts[0]?.url || ''
        }
        return origCommand()
    })

    overwrite('getPageSource', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const result = await this.scriptEvaluate({
                expression: 'document.documentElement.outerHTML',
                target: { context },
                awaitPromise: false
            })
            return (result as { result: { value: string } }).result?.value || ''
        }
        return origCommand()
    })

    overwrite('takeScreenshot', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentTopLevelContext()
            const { data } = await this.browsingContextCaptureScreenshot({
                context,
                origin: 'viewport',
                format: { type: 'image/png' }
            })
            return data
        }
        return origCommand()
    })

    overwrite('refresh', async function (this: WebdriverIO.Browser, origCommand: () => Promise<null>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentTopLevelContext()
            await this.browsingContextReload({ context, wait: 'complete' })
            return null
        }
        return origCommand()
    })

    overwrite('takeElementScreenshot', async function (this: WebdriverIO.Browser, origCommand: (elementId: string) => Promise<string>, elementId: string) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            /**
             * W3C "get a known element": BiDi clips a stale element to 0x0
             */
            await executeInContext(this, context, withKnownElement(() => null), { [ELEMENT_KEY]: elementId }).catch(nameStaleElement)
            const clip: WebDriverTypes.remote.BrowsingContextElementClipRectangle = { type: 'element', element: { sharedId: elementId } }
            const { data } = await this.browsingContextCaptureScreenshot({ context, clip })
            return data
        }
        return origCommand(elementId)
    })
}
