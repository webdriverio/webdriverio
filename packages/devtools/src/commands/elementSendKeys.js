import { getStaleElementError } from '../utils'
import path from "path"

export default async function elementSendKeys ({ elementId, text }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const tagName = await (await elementHandle.getProperty('tagName')).jsonValue()
    const type = await (await elementHandle.getProperty('type')).jsonValue()

    if(tagName === 'INPUT' && type === 'file'){
        const paths = (text || '').split('\n').map(p => path.resolve(p))
        await elementHandle.uploadFile(...paths)
    } else {
        await page.keyboard.type(text)
    }

    return null
}
