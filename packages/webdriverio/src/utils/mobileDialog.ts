/**
 * iOS SpringBoard bundle ID used to activate the system UI so permission
 * dialogs are accessible to Appium.
 */
export const SPRINGBOARD_BUNDLE_ID = 'com.apple.springboard'

/**
 * Convert a string into an XPath 1.0 string literal.
 *
 * XPath 1.0 has no escape sequences inside quoted strings, so a backslash
 * before `'` is not valid (e.g. `'Don\'t Allow'` is a syntax error). Use
 * matching quotes that do not appear in the value, or assemble the value
 * with `concat()` when both quote types are present.
 */
export function toXPathStringLiteral(value: string): string {
    if (!value.includes("'")) {
        return `'${value}'`
    }
    if (!value.includes('"')) {
        return `"${value}"`
    }
    /**
     * XPath concat() joins single-quoted segments with a double-quoted
     * apostrophe literal: concat('foo', "'", 'bar')
     */
    const concatSeparator = ', "\'", '
    return `concat(${value.split("'").map((part) => `'${part}'`).join(concatSeparator)})`
}

export function androidButtonSelector(buttonText: string): string {
    return `//android.widget.Button[@text=${toXPathStringLiteral(buttonText)}]`
}

export function assertMobileNativeDialogCommand(
    browser: WebdriverIO.Browser,
    commandName: string
): void {
    if (!browser.isMobile) {
        throw new Error(`The \`${commandName}\` command is only available for mobile platforms.`)
    }
    if (!browser.isNativeContext) {
        throw new Error(`The \`${commandName}\` command is only available for mobile platforms in the NATIVE context.`)
    }
}

function isMissingDialogError(err: unknown): boolean {
    if (!(err instanceof Error)) {
        return false
    }
    return (
        err.message.includes('no such element') ||
        err.message.includes('Unable to find an element') ||
        err.message.includes('no such alert')
    )
}

async function interactWithDialog(
    browser: WebdriverIO.Browser,
    action: 'accept' | 'dismiss',
    buttonText: string | undefined,
    isIOS: boolean
): Promise<void> {
    if (buttonText) {
        const selector = isIOS ? `~${buttonText}` : androidButtonSelector(buttonText)
        await browser.$(selector).click()
        return
    }

    if (action === 'accept') {
        await browser.acceptAlert()
        return
    }

    await browser.dismissAlert()
}

/**
 * Handle a native iOS/Android alert or permission dialog.
 *
 * When `buttonText` is provided the matching button is clicked (accessibility
 * ID on iOS, XPath `@text` on Android). Otherwise the default
 * accept/dismiss alert command is used.
 */
export async function handleMobileDialog(
    browser: WebdriverIO.Browser,
    action: 'accept' | 'dismiss',
    buttonText?: string
): Promise<void> {
    if (browser.isIOS) {
        const { bundleId } = await browser.execute('mobile: activeAppInfo') as { bundleId?: string }
        try {
            await browser.execute('mobile: activateApp', { bundleId: SPRINGBOARD_BUNDLE_ID })
            await interactWithDialog(browser, action, buttonText, true)
        } catch (err) {
            /**
             * Ignore "no such element/alert" errors (dialog not present or
             * already handled). Re-throw everything else so session/driver
             * failures are not swallowed.
             */
            if (isMissingDialogError(err)) {
                return
            }
            throw err
        } finally {
            /**
             * Always reactivate the original app, including when SpringBoard
             * activation or the button click fails.
             */
            if (bundleId) {
                await browser.execute('mobile: activateApp', { bundleId })
            }
        }
        return
    }

    try {
        await interactWithDialog(browser, action, buttonText, false)
    } catch (err) {
        if (isMissingDialogError(err)) {
            return
        }
        throw err
    }
}
