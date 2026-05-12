/**
 * Returns dialog's type, can be one of `alert`, `beforeunload`, `confirm` or `prompt`.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). For mobile native dialogs,
 * use the appropriate mobile handling strategies instead.
 * :::
 *
 * <example>
    :dialogType.js
    // Listen for the dialog event to get the dialog object
    browser.on('dialog', async (dialog) => {
        const type = await dialog.type();
        console.log(type); // prints: 'alert', 'confirm', 'prompt', or 'beforeunload'
    });
 * </example>
 *
 * @alias dialog.type
 * @returns {string}  The type of the dialog
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
