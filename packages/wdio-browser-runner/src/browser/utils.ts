export function getCID() {
    const urlParamString = new URLSearchParams(window.location.search)
    return (
        // initial request contains cid as query parameter
        urlParamString.get('cid') ||
        // if not provided check for document cookie, set by `@wdio/runner` package
        (document.cookie.split(';') || [])
            .find((c) => c.includes('WDIO_CID'))
            ?.trim()
            .split('=')
            .pop()
    )
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
