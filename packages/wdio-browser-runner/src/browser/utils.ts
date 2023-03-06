export function getCID () {
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
