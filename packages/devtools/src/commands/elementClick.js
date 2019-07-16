export default async function elementClick ({ elementId }) {
    const page = this.windows.get(this.currentWindowHandle)
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    /**
     * ensure to fulfill the click promise if the click has triggered an alert
     */
    await new Promise((resolve) => {
        const dialogHandler = () => resolve()
        page.once('dialog', dialogHandler)
        return elementHandle.click().then(() => {
            page.removeListener('dialog', dialogHandler)
            resolve()
        })
    })

    return null
}
