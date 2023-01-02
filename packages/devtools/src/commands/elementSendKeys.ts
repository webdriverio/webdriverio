import path from 'node:path'
import { UNICODE_CHARACTERS } from '@wdio/utils'
import type { ElementHandle, KeyInput } from 'puppeteer-core'

import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Element Send Keys command scrolls into view the form control element and then sends
 * the provided keys to the element. In case the element is not keyboard-interactable,
 * an element not interactable error is returned. The key input state used for input
 * may be cleared mid-way through "typing" by sending the null key, which is U+E000 (NULL)
 *
 * @alias browser.elementSendKeys
 * @see https://w3c.github.io/webdriver/#dfn-element-send-keys
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} text       string to send as keystrokes to the element
 */
export default async function elementSendKeys (
    this: DevToolsDriver,
    { elementId, text }: { elementId: string, text: string }
) {
    const elementHandle = await this.elementStore.get(elementId) as any as ElementHandle<HTMLInputElement>

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    await elementHandle.focus()
    const page = this.getPageHandle()
    const propertyHandles = {
        tagName: await elementHandle.getProperty('tagName'),
        type: await elementHandle.getProperty('type')
    }

    const tagName = await propertyHandles.tagName?.jsonValue() as unknown as string
    const type = await propertyHandles.type?.jsonValue() as unknown as string
    let typeInput: string[] = [text]

    for (const [key, value] of Object.entries(UNICODE_CHARACTERS)) {
        typeInput = typeInput.reduce((input, val) => [
            ...input,
            ...val.split(value).flatMap(
                (value: string, index: number, array: string[]) =>
                    array.length - 1 !== index // check for the last item
                        ? [value, key]
                        : value,
            )
        ], [] as string[])
    }

    if (tagName === 'INPUT' && type === 'file') {
        const paths = (text || '').split('\n').map(p => path.resolve(p))
        await elementHandle.uploadFile(...paths)
    } else {
        for (const input of typeInput) {
            UNICODE_CHARACTERS[input as keyof typeof UNICODE_CHARACTERS]
                ? await page.keyboard.press(input as KeyInput)
                : await page.keyboard.type(input)
        }
    }

    return null
}
