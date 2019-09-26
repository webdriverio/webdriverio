export default async function deleteSession () {
    await this.browser.close()
    return null
}
