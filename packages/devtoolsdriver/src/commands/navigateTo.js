export default async function navigateTo (browser, params) {
    const page = (await browser.pages())[0]
    await page.goto(params.url)
    return null
}
