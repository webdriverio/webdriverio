import uuidv4 from 'uuid/v4'

export default async function createWindow () {
    const newPage = await this.browser.newPage()
    const handle = uuidv4()

    await newPage.bringToFront()

    this.currentWindowHandle = handle
    this.windows.set(handle, newPage)
    return this.currentWindowHandle
}
