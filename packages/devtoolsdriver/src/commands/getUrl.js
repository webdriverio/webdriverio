export default async function navigateTo (browser) {
    const page = (await browser.pages())[0]
    return page.url()
}
