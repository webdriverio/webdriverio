export default async function deleteSession () {
    const pages = await this.browser.pages()

    /**
     * close all tabs
     */
    for (const page of pages) {
        await page.close()
    }

    await this.browser.close()
    return null
}
