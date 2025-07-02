export async function findIframeInShadowDOM(
    browser: WebdriverIO.Browser,
    urlFragment: string
): Promise<WebdriverIO.Element | null> {
    return await browser.execute(function (fragment: string) {
        function findIframe(root: ShadowRoot | Document): HTMLIFrameElement | null {
            const allElements = Array.from(root.querySelectorAll('iframe'))
            for (const el of allElements) {
                if (el instanceof HTMLIFrameElement && el.src.includes(fragment)) {
                    return el
                }
            }

            const shadowHosts = Array.from(root.querySelectorAll('*'))
            for (const host of shadowHosts) {
                if ((host as HTMLElement).shadowRoot) {
                    const result = findIframe((host as HTMLElement).shadowRoot!)
                    if (result) {return result}
                }
            }

            return null
        }

        return findIframe(document)
    }, urlFragment)
}
