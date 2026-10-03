/**
 * Get the URL of the document shown in this browsing context, read from the
 * page. It also updates the `url` property, which otherwise holds the URL the
 * context was last navigated to and does not follow navigations the page did itself.
 *
 * <example>
    :getUrl.js
    it('reads the url after the page changed it', async () => {
        const page = await browser.url('https://webdriver.io')
        await page.execute(() => history.pushState({}, '', '/docs/api'))

        console.log(page.url) // outputs: "https://webdriver.io", the url it was navigated to
        console.log(await page.getUrl()) // outputs: "https://webdriver.io/docs/api"
        console.log(page.url) // outputs: "https://webdriver.io/docs/api"
    })
 * </example>
 *
 * @alias browsingContext.getUrl
 * @return {string}  the document URL
 */
export async function getUrl (this: WebdriverIO.BrowsingContext): Promise<string> {
    const url = await this.execute(() => document.URL)
    if (typeof url === 'string') {
        this.url = url
    }
    return url
}
