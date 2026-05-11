/**
 * Dismisses the dialog and returns when the dialog has been handled.
 *
 * :::info
 * Works with both browser dialogs (via BiDi protocol) and mobile permission dialogs (iOS/Android).
 * :::
 *
 * <example>
    :dialogDismiss.js
    // Browser dialog
    await dialog.dismiss();
 * </example>
 *
 * <example>
    :dialogDismissMobile.js
    // Mobile permission dialog (iOS/Android)
    await dialog.dismiss();
 * </example>
 *
 * @alias dialog.dismiss
 */
// actual implementation is located in packages/webdriverio/src/session/dialog.ts
