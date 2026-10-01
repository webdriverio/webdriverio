export async function getTitle (this: WebdriverIO.BrowsingContext): Promise<string> {
    return this.execute(() => document.title)
}

export async function getUrl (this: WebdriverIO.BrowsingContext): Promise<string> {
    const url = await this.execute(() => document.URL)
    if (typeof url === 'string') {
        this.url = url
    }
    return url
}
