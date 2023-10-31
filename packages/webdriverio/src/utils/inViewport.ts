import { ELEMENT_KEY } from '../constants.js'
import { getBrowserObject } from './index.js'
import isElementInViewportScript from '../scripts/isElementInViewport.js'

export async function isInViewport (elm: WebdriverIO.Element) {
    const browser = getBrowserObject(elm)
    return browser.execute(isElementInViewportScript, {
        [ELEMENT_KEY]: elm.elementId, // w3c compatible
        ELEMENT: elm.elementId // jsonwp compatible
    } as any as HTMLElement)
}
export async function moveInViewport (elm: WebdriverIO.Element) {
    await  elm.scrollIntoView({ block : 'nearest', inline: 'nearest', behavior: 'instant' })
    if (await isInViewport(elm)) {
        await  elm.scrollIntoView({ block : 'center', inline: 'center', behavior: 'instant' })
    }
}