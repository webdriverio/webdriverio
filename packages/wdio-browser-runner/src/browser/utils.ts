export function getCID() {
    const urlParamString = new URLSearchParams(window.location.search)
    const cid = (
        // initial request contains cid as query parameter
        urlParamString.get('cid') ||
        // if not provided check for document cookie, set by `@wdio/runner` package
        (document.cookie.split(';') || [])
            .find((c) => c.includes('WDIO_CID'))
            ?.trim()
            .split('=')
            .pop()
    )

    if (!cid) {
        throw new Error('"cid" query parameter is missing')
    }

    return cid
}

export const showPopupWarning = <T>(name: string, value: T, defaultValue?: T) => (...params: any[]) => {
    const formatedParams = params.map(p => JSON.stringify(p)).join(', ')

    console.warn(`WebdriverIO encountered a \`${name}(${formatedParams})\` call that it cannot handle by default, so it returned \`${value}\`. Read more in https://webdriver.io/docs/runner#limitations.
  If needed, mock the \`${name}\` call manually like:
  \`\`\`
  import { spyOn } from "@wdio/browser-runner"
  spyOn(window, "${name}")${defaultValue ? `.mockReturnValue(${JSON.stringify(defaultValue)})` : ''}
  ${name}(${formatedParams})
  expect(${name}).toHaveBeenCalledWith(${formatedParams})
  \`\`\``)
    return value
}

export function sanitizeConsoleArgs (args: unknown[]) {
    return args.map((arg: any) => {
        if (arg === undefined) {
            return 'undefined'
        }
        try {
            if (arg && typeof arg.selector === 'string' && arg.error) {
                return `WebdriverIO.Element<"${arg.selector}">`
            }
            if (arg && typeof arg.selector === 'string' && typeof arg.length === 'number') {
                return `WebdriverIO.ElementArray<${arg.length}x "${arg.selector}">`
            }
            if (arg && typeof arg.selector === 'string') {
                return `WebdriverIO.Element<"${arg.selector}">`
            }
            if (arg && typeof arg.sessionId === 'string') {
                return `WebdriverIO.Browser<${arg.capabilities.browserName}>`
            }
        } catch (err) {
            // ignore
        }

        if (
            arg instanceof HTMLElement ||
            (arg && typeof arg === 'object' && typeof arg.then === 'function') ||
            typeof arg === 'function'
        ) {
            return arg.toString()
        }
        if (arg instanceof Error) {
            return arg.stack
        }
        return arg
    })
}
