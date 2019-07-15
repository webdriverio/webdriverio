import { ELEMENT_KEY } from '../constants'

const SUPPORTED_STRATEGIES = ['css selector', 'tag name']

export default async function findElement ({ using, value }) {
    if (!SUPPORTED_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    const element = await page.$(value)

    if (!element) {
        return new Error(`Element with selector "${value}" not found`)
    }

    const elementId = this.elementStore.set(element)
    return { [ELEMENT_KEY]: elementId }
}
