/**
 * A message displayed in the dialog.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). For mobile native dialogs,
 * use the [`browser.dialog()`](/docs/api/mobile/dialog) command instead.
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
