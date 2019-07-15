import { ELEMENT_KEY } from '../constants'

const SUPPORTED_STRATEGIES = ['css selector', 'tag name']

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    const elements = await page.$$(value)

    if (elements.length === 0) {
        return elements
    }

    return elements.map((element) => ({
        [ELEMENT_KEY]: this.elementStore.set(element)
    }))
}
