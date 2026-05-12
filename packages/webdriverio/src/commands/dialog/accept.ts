/**
 * Accepts the dialog and returns when the dialog has been handled.
 *
 * :::info
 * Only works with browser dialogs (via BiDi protocol). For mobile native dialogs,
 * use the appropriate mobile handling strategies instead.
 * :::
 *
 * <example>
    :dialogAccept.js
    // Listen for the dialog event to get the dialog object
    browser.on('dialog', async (dialog) => {
        console.log(dialog.message()); // prints: 'Hello, world!'
        await dialog.accept();
    });

    // Or accept a prompt dialog with text
    browser.on('dialog', async (dialog) => {
        if (dialog.type() === 'prompt') {
            await dialog.accept('my input');
        }
    });
 * </example>
 *
 * @alias dialog.accept
 * @param {string=} promptText  A text to enter into prompt. Does not cause any effects if the dialog's type is not prompt.
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
