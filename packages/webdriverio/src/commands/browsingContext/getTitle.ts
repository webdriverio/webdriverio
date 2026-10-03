/**
 * Get the title of the document shown in this browsing context. For a frame
 * this is the title of the frame's own document.
 *
 * <example>
    :getTitle.js
    it('reads the title of a background tab', async () => {
        await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        console.log(await tab.getTitle()) // outputs the title of the API page
    })
 * </example>
 *
 * @alias browsingContext.getTitle
 * @return {string}  the document title
 */
export async function getTitle (this: WebdriverIO.BrowsingContext): Promise<string> {
    return this.execute(() => document.title)
}
