/**
 * If dialog is prompt, returns default prompt value. Otherwise, returns empty string.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). For mobile native dialogs,
 * use the [`browser.dialog()`](/docs/api/mobile/dialog) command instead.
 * :::
 *
 * <example>
    :dialogDefaultValue.js
    // Listen for the dialog event to get the dialog object
    browser.on('dialog', async (dialog) => {
        if (dialog.type() === 'prompt') {
            const value = await dialog.defaultValue();
            console.log(value); // prints the default prompt value
        }
    });
 * </example>
 *
 * @alias dialog.defaultValue
 * @returns {string}  The default prompt value, or empty string if not a prompt.
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
