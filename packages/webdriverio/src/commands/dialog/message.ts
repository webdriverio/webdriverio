/**
 * A message displayed in the dialog.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). Native mobile dialogs do
 * not expose their message through WebDriver. Use
 * [`browser.acceptDialog`](/docs/api/mobile/acceptDialog) or
 * [`browser.dismissDialog`](/docs/api/mobile/dismissDialog) to handle them.
 * :::
 *
 * <example>
    :dialogMessage.js
    // Listen for the dialog event to get the dialog object
    browser.on('dialog', async (dialog) => {
        const message = await dialog.message();
        console.log(message); // prints: 'Hello, world!'
    });
 * </example>
 *
 * @alias dialog.message
 * @returns {string}  The message displayed in the dialog.
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
