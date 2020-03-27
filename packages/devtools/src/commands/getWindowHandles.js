import { v4 as uuidv4 } from 'uuid'

export default async function getWindowHandles() {
    let newPages = await this.browser.pages()

    const stalePageIds = []
    this.windows.forEach((page, id) => {
        if (newPages.includes(page)) {
            newPages = newPages.filter(newPage => page !== newPage)
        } else {
            stalePageIds.push(id)
        }
    })

    // remove stale pages that were closed with JavaScript
    stalePageIds.forEach(pageId => this.windows.delete(pageId))
    // add new pages that were created within another target
    newPages.forEach(page => this.windows.set(uuidv4(), page))

    return Array.from(this.windows.keys())
}
