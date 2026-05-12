/**
 * Dismisses the dialog and returns when the dialog has been handled.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). For mobile native dialogs,
 * use the appropriate mobile handling strategies instead.
 * :::
 *
 * <example>
    :dialogDismiss.js
    // Listen for the dialog event to get the dialog object
    browser.on('dialog', async (dialog) => {
        console.log(dialog.message()); // prints: 'Are you sure?'
        await dialog.dismiss();
    });
 * </example>
 *
 * @alias dialog.dismiss
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
