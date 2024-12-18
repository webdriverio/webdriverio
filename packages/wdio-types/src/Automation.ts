export interface Driver<T> {
    newSession(
        options: T,
        modifier?: (...args: unknown[]) => unknown,
        userPrototype?: Record<string, unknown>,
        customCommandWrapper?: (...args: unknown[]) => unknown
    ): unknown

    attachToSession(
        options: unknown,
        modifier?: (...args: unknown[]) => unknown,
        userPrototype?: Record<string, unknown>,
        customCommandWrapper?: (...args: unknown[]) => unknown
    ): unknown

    reloadSession (
        client: unknown,
        newCapabilities: WebdriverIO.Capabilities
    ): unknown
}
