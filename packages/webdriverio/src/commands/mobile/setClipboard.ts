import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Set the content of the system clipboard.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * The `content` must be provided as a base64-encoded string. Android only supports the `plaintext`
 * content type.
 *
 * <example>
    :setClipboard.js
    it('should set the clipboard content', async () => {
        // Set plaintext clipboard content
        const base64Content = Buffer.from('Hello World').toString('base64')
        await browser.setClipboard(base64Content, 'plaintext')
    })
 * </example>
 *
 * @param {string}  content       Base64-encoded string to set as clipboard content.
 * @param {string}  [contentType] Content type (e.g. `'plaintext'`, `'image'`, `'url'`). Android only supports `'plaintext'`.
 * @param {string}  [label]       Clipboard label (Android only).
 *
 * @support ["ios","android"]
 */
export async function setClipboard(
    this: WebdriverIO.Browser,
    content: string,
    contentType?: string,
    label?: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `setClipboard` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: setClipboard', { content, contentType, label })
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: setClipboard', '/appium/device/set_clipboard')
        return browser.appiumSetClipboard(content, contentType, label)
    }
}
