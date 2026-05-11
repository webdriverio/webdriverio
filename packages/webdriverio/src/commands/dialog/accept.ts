/**
 * Accepts the dialog and returns when the dialog has been handled.
 *
 * :::info
 * Works with both browser dialogs (via BiDi protocol) and mobile permission dialogs (iOS/Android).
 * :::
 *
 * <example>
    :dialogAccept.js
    // Browser dialog
    await dialog.accept();
    await dialog.accept(promptText);
 * </example>
 *
 * <example>
    :dialogAcceptMobile.js
    // Mobile permission dialog (iOS/Android)
    await dialog.accept();
 * </example>
 *
 * @alias dialog.accept
 * @param {string=} promptText  A text to enter into prompt. Does not cause any effects if the dialog's type is not prompt.
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
