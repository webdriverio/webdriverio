/**
 * Chrome and Edge implement `webExtension.install` and leave it disabled until
 * the browser is started with `--enable-unsafe-extension-debugging` and
 * `--remote-debugging-pipe`. The driver then reports `Method not available`.
 * Name the flags on that error so the failure is actionable.
 */
export function annotateWebExtensionError (
    err: unknown,
    command: 'webExtension.install' | 'webExtension.uninstall'
): Error {
    const message = err instanceof Error ? err.message : String(err)
    if (!/method not available/i.test(message)) {
        return err instanceof Error ? err : new Error(message)
    }

    /**
     * `Error` `cause` is ES2022. Chrome 90, the oldest browser this bundle
     * still runs in, does not accept the second constructor argument, and the
     * browser lib check rejects the `cause` property.
     */
    const error = new Error(
        `${message} Start Chrome or Edge with --enable-unsafe-extension-debugging and --remote-debugging-pipe so ${command} is available. Chrome 136 and newer also require --user-data-dir together with --remote-debugging-pipe.`
    )
    if (err instanceof Error) {
        Object.defineProperty(error, 'cause', {
            configurable: true,
            value: err
        })
    }
    return error
}
