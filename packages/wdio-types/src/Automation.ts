export interface Driver<T> {
    newSession(
        options: T,
        modifier?: (...args: any[]) => any,
        userPrototype?: Record<string, any>,
        customCommandWrapper?: (...args: any[]) => any
    ): any

    attachToSession(
        options: any,
        modifier?: (...args: any[]) => any,
        userPrototype?: Record<string, any>,
        customCommandWrapper?: (...args: any[]) => any
    ): any

    reloadSession (
        client: any,
        newCapabilities: WebdriverIO.Capabilities
    ): any
}
