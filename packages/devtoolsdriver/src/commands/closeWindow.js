import uuidv4 from 'uuid/v4'

export default async function closeWindow () {
    const page = this.windows.get(this.currentWindowHandle)
    await page.close()
    this.windows.delete(this.currentWindowHandle)

    const handles = this.windows.keys()
    this.currentWindowHandle = handles.next().value

    if (!this.currentWindowHandle) {
        const page = await this.browser.newPage()
        const newWindowHandle = uuidv4()
        this.windows.set(newWindowHandle, page)
        this.currentWindowHandle = newWindowHandle
    }

    const newPage = this.windows.get(this.currentWindowHandle)
    await newPage.bringToFront()
    return this.currentWindowHandle
}
