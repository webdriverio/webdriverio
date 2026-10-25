import { browser, $, expect } from '@wdio/globals'

const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html><title>checks</title>
<ul id="list"><li class="item">one</li></ul>
<script>window.renderItems = (items) => {
    document.getElementById('list').innerHTML = items.map((item) => '<li class="item">' + item + '</li>').join('')
}</script>`)}`

const renderItems = (items: string[]) => browser.execute((list) => (window as unknown as { renderItems: (items: string[]) => void }).renderItems(list), items)
const errorOf = (promise: Promise<unknown>) => promise.then(() => undefined, (err: Error) => err)

/**
 * A BiDi session gives a script the node that the page removed (Classic fails with a
 * stale element error first): the check commands find the element again, as in Classic,
 * instead of checking the removed node
 */
describe('the checks of an element that the page rendered again', () => {
    beforeEach(async () => {
        await browser.url(PAGE)
    })

    it('isDisplayed finds it again, and a reverse wait does not pass', async () => {
        const elem = await $('.item')
        await elem.getText()
        await renderItems(['replaced'])

        expect(await elem.isDisplayed()).toBe(true)
        const error = await errorOf(elem.waitForDisplayed({ reverse: true, timeout: 500 }))
        expect(error?.message).toContain('still displayed after 500ms')
        await expect(expect(elem).not.toBeDisplayed({ wait: 500 })).rejects.toThrow()
        expect(await elem.isClickable()).toBe(true)
    })

    it('isFocused finds it again', async () => {
        const elem = await $('.item')
        await elem.getText()
        await renderItems(['replaced'])
        await browser.execute(() => {
            const item = document.querySelector('.item') as HTMLElement
            item.tabIndex = 0
            item.focus()
        })

        expect(await elem.isFocused()).toBe(true)
    })

    it('isStable finds it again and checks the movement of the new element', async () => {
        const elem = await $('.item')
        await elem.getText()
        await renderItems(['replaced'])
        await browser.execute(() => {
            const style = document.createElement('style')
            style.textContent = '@keyframes move { from { margin-left: 0 } to { margin-left: 300px } } .item { animation: move 1s linear infinite }'
            document.head.appendChild(style)
        })

        expect(await elem.isStable()).toBe(false)
    })

    it('isDisplayed finds it again after the page is loaded again', async () => {
        const elem = await $('.item')
        await elem.getText()
        await browser.url(PAGE)

        expect(await elem.isDisplayed()).toBe(true)
    })
})
