import url from 'node:url'
import path from 'node:path'
import { browser, $, $$, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

interface Fixture {
    renderLate (count: number): void
    renderItems (texts: string[]): void
    renderShadow (className: string, texts: string[]): void
    renderForm (text: string): void
    renderDates (): void
    renderDateHost (): void
    renderSelect (): void
    renderFar (): void
}

const FIXTURE = url.pathToFileURL(path.resolve(__dirname, '__fixtures__', 'findElementAgain.html')).href

const renderLate = (count: number) => browser.execute(
    (count) => (window as unknown as Fixture).renderLate(count), count)
const renderItems = (texts: string[]) => browser.execute(
    (texts) => (window as unknown as Fixture).renderItems(texts), texts)
const renderShadow = (className: string, texts: string[]) => browser.execute(
    (className, texts) => (window as unknown as Fixture).renderShadow(className, texts), className, texts)
const renderForm = (text: string) => browser.execute(
    (text) => (window as unknown as Fixture).renderForm(text), text)
const renderDates = () => browser.execute(() => (window as unknown as Fixture).renderDates())
const renderDateHost = () => browser.execute(() => (window as unknown as Fixture).renderDateHost())
const renderSelect = () => browser.execute(() => (window as unknown as Fixture).renderSelect())
const renderFar = () => browser.execute(() => (window as unknown as Fixture).renderFar())
const errorOf = (promise: Promise<unknown>) => promise.then(() => undefined, (e: Error) => e)

/**
 * An element is found again when a command needs it and it has no element id
 * (it wasn't on the page when it was looked up) or it is stale (the page
 * replaced it). It is found again with the command, index and strictness it
 * was found with, see https://github.com/webdriverio/webdriverio/issues/15956
 */
describe('finding an element again', () => {
    before(async () => {
        await browser.addLocatorStrategy('lateParagraph', () => document.querySelector('.late') as HTMLElement)
        /**
         * `element.custom$` gives its element as the last argument
         */
        await browser.addLocatorStrategy('inForm', (...args: unknown[]) => (
            (args[args.length - 1] as HTMLElement).querySelector('.in-form') as HTMLElement
        ))
    })

    beforeEach(async () => {
        await browser.url(FIXTURE)
    })

    describe('with strict selectors', () => {
        it('isDisplayed takes the first match of an opted out element that appears later', async () => {
            const elem = await $('.late', { strict: false })
            expect(elem.elementId).toBeUndefined()

            await renderLate(2)
            await browser.waitUntil(() => elem.isDisplayed(), { timeout: 5000 })
            await expect(elem).toHaveText('late 1')
        })

        it('isDisplayed throws for a strict element that appears more than once', async () => {
            const elem = await $('.late')
            expect(elem.elementId).toBeUndefined()

            await renderLate(2)
            const err = await errorOf(elem.isDisplayed())
            expect(err?.name).toBe('StrictSelectorError')
        })

        it('a command waits for an opted out element and takes the first match', async () => {
            const elem = await $('.late', { strict: false })
            await renderLate(2)
            await expect(elem.getText()).resolves.toBe('late 1')
        })

        it('a command throws for a strict element that appears more than once', async () => {
            const elem = await $('.late')
            await renderLate(2)
            const err = await errorOf(elem.getText())
            expect(err?.name).toBe('StrictSelectorError')
        })

        it('a stale strict element is found again when it matches once', async () => {
            const elem = await $('.item')
            await expect(elem.getText()).resolves.toBe('first')

            await renderItems(['replaced'])
            await expect(elem.getText()).resolves.toBe('replaced')
        })

        it('a stale strict element throws when it matches more than once', async () => {
            const elem = await $('.item')
            await expect(elem.getText()).resolves.toBe('first')

            await renderItems(['one', 'two'])
            const err = await errorOf(elem.getText())
            expect(err?.name).toBe('StrictSelectorError')
        })

        it('a stale element from $$ is found again at the same index', async () => {
            await renderItems(['one', 'two'])
            const elem = (await $$('.item'))[1]
            await expect(elem.getText()).resolves.toBe('two')

            await renderItems(['new one', 'new two', 'new three'])
            await expect(elem.getText()).resolves.toBe('new two')
        })
    })

    describe('in a shadow root', () => {
        it('a command waits for a shadow$ element that appears later', async () => {
            const elem = await $('#host').shadow$('.late-in-shadow')
            expect(elem.elementId).toBeUndefined()

            await renderShadow('late-in-shadow', ['late'])
            await expect(elem.getText()).resolves.toBe('late')
        })

        it('a stale shadow$ element is found again', async () => {
            const elem = await $('#host').shadow$('.in-shadow')
            await expect(elem.getText()).resolves.toBe('first')

            await renderShadow('in-shadow', ['replaced'])
            await expect(elem.getText()).resolves.toBe('replaced')
        })

        it('a stale shadow$$ element is found again at the same index', async () => {
            await renderShadow('in-shadow', ['one', 'two'])
            const elem = (await $('#host').shadow$$('.in-shadow'))[1]
            await expect(elem.getText()).resolves.toBe('two')

            await renderShadow('in-shadow', ['new one', 'new two', 'new three'])
            await expect(elem.getText()).resolves.toBe('new two')
        })
    })

    describe('with a custom strategy or a function', () => {
        it('waitForExist gives a custom$ element its element id', async () => {
            const elem = await browser.custom$('lateParagraph')
            expect(elem.elementId).toBeUndefined()

            await renderLate(1)
            await elem.waitForExist({ timeout: 5000 })
            expect(elem.elementId).toBeDefined()
            await expect(elem.getText()).resolves.toBe('late 1')
        })

        it('a stale element.custom$ element is found again in its parent that was replaced', async () => {
            const elem = await $('#form').custom$('inForm')
            await expect(elem.getText()).resolves.toBe('first')

            await renderForm('replaced')
            await expect(elem.getText()).resolves.toBe('replaced')
        })

        it('waitForExist gives a $(function) element its element id', async () => {
            const elem = await $(() => document.querySelector('.late') as HTMLElement)
            expect(elem.elementId).toBeUndefined()

            await renderLate(1)
            await elem.waitForExist({ timeout: 5000 })
            expect(elem.elementId).toBeDefined()
            await expect(elem.getText()).resolves.toBe('late 1')
        })
    })

    describe('as an argument of another command', () => {
        it('an action waits for an origin element that appears later', async () => {
            const origin = await $('.late')
            expect(origin.elementId).toBeUndefined()

            await renderLate(1)
            await browser.action('pointer').move({ origin }).down().up().perform()
            expect(origin.elementId).toBeDefined()
        })

        it('dragAndDrop waits for a target element that appears later', async () => {
            const target = await $('.late')
            expect(target.elementId).toBeUndefined()

            await renderLate(1)
            await $('.item').dragAndDrop(target)
            expect(target.elementId).toBeDefined()
        })
    })

    /**
     * A BiDi session gives a script the node that the page removed (Classic fails with a
     * stale element error first): the check commands find the element again, as in Classic,
     * instead of checking the removed node
     */
    describe('the checks of an element that the page rendered again', () => {
        it('isDisplayed finds it again, and a reverse wait does not pass', async () => {
            const elem = await $('.item')
            await renderItems(['replaced'])

            expect(await elem.isDisplayed()).toBe(true)
            const error = await errorOf(elem.waitForDisplayed({ reverse: true, timeout: 500 }))
            expect(error?.message).toContain('still displayed after 500ms')
            await expect(expect(elem).not.toBeDisplayed({ wait: 500 })).rejects.toThrow()
            expect(await elem.isClickable()).toBe(true)
        })

        it('isFocused finds it again', async () => {
            const elem = await $('.item')
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
            await browser.url(FIXTURE)

            expect(await elem.isDisplayed()).toBe(true)
        })

        it('isEqual compares the element that the page rendered again', async () => {
            const elem = await $('.item')
            await renderItems(['replaced'])

            expect(await elem.isEqual(await $('.item'))).toBe(true)
        })

        it('isEqual of an element that the page removed gives false at once', async () => {
            const elem = await $('.item')
            const other = await $('#late-area')
            await renderItems([])

            const start = Date.now()
            expect(await elem.isEqual(other)).toBe(false)
            expect(Date.now() - start).toBeLessThan(browser.options.waitforTimeout ?? 5000)
        })

        it('isEqual of a valid element and an element that the page removed gives false', async () => {
            const elem = await $('.item')
            const other = await $('#late-area')
            await renderItems([])

            expect(await other.isEqual(elem)).toBe(false)
        })

        it('isEqual finds again only the stale element: a valid one can match another node now', async () => {
            await renderItems(['first', 'second'])
            const stale = await $$('.item')[1]
            await renderItems(['first', 'second'])
            const valid = await $$('.item')[1]
            await browser.execute(() => {
                const top = document.createElement('li')
                top.className = 'item'
                document.querySelector('#items')!.prepend(top)
            })

            // `stale` is found again as the item at index 1 now ("first"), `valid` is still "second"
            expect(await stale.isEqual(valid)).toBe(false)
        })

        it('isEqual compares with an element reference, which has no selector', async () => {
            const elem = await $('.item')
            await renderItems(['replaced'])

            expect(await elem.isEqual(await $(await browser.findElement('css selector', '.item')))).toBe(true)
        })

        it('isEqual compares an element whose parent the page rendered again', async () => {
            const elem = await $('#form').$('.in-form')
            await renderForm('replaced')

            expect(await elem.isEqual(await $('#form').$('.in-form'))).toBe(true)
        })

        it('isEqual of an element whose parent the page removed gives false at once', async () => {
            const elem = await $('#form').$('.in-form')
            const other = await $('#late-area')
            await browser.execute(() => document.querySelector('#form')!.remove())

            const start = Date.now()
            expect(await elem.isEqual(other)).toBe(false)
            expect(Date.now() - start).toBeLessThan(browser.options.waitforTimeout ?? 5000)
        })
    })

    /**
     * BiDi gives a script the node that the page removed, with no error. A command that runs a
     * script on its element checks that the element is still on the page, as `isDisplayed` does
     */
    describe('a script on an element that the page rendered again', () => {
        it('scrollIntoView scrolls the element that the page rendered again', async () => {
            const elem = await $('#far')
            await renderFar()
            await elem.scrollIntoView()

            expect(await browser.execute(() => {
                const rect = document.querySelector('#far')!.getBoundingClientRect()
                return rect.top >= 0 && rect.bottom <= window.innerHeight
            })).toBe(true)
        })

        it('scrollIntoView scrolls an element that the page renders again on each scroll', async () => {
            const elem = await $('#far')
            await browser.execute(() => window.addEventListener('scroll', () => (window as unknown as Fixture).renderFar()))
            await elem.scrollIntoView()

            expect(await browser.execute(() => {
                const rect = document.querySelector('#far')!.getBoundingClientRect()
                return rect.top >= 0 && rect.bottom <= window.innerHeight
            })).toBe(true)
        })

        it('scrollIntoView of an element in view that its scroll removes throws', async () => {
            const elem = await $('#select')
            await browser.execute(() => window.addEventListener('scroll', () => document.querySelector('#select')?.remove()))

            expect((await errorOf(elem.scrollIntoView()))?.message).toContain("element wasn't found")
        })
    })

    /**
     * The scroll itself makes the page render the element again: a component that renders when it
     * becomes visible, a list or a parent that renders again on `scroll`. The command must end with
     * the element on the page in view, or throw when the element is gone.
     */
    describe('scrollIntoView when its scroll makes the page render the element again', () => {
        /**
         * whether the element that the selector finds now (in `host`'s shadow root, if given) is in
         * the viewport, and in its scroll container if given
         */
        const isInView = (selector: string, { index = 0, host, container }: { index?: number, host?: string, container?: string } = {}) => browser.execute(
            (selector, index, host, container) => {
                const root = host ? document.querySelector(host)!.shadowRoot! : document
                const rect = root.querySelectorAll(selector)[index].getBoundingClientRect()
                const box = container ? document.querySelector(container)!.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
                return rect.top >= Math.max(0, box.top) && rect.bottom <= Math.min(window.innerHeight, box.bottom)
            }, selector, index, host ?? '', container ?? '')

        /**
         * the distance in px of the element from its `block` position in the viewport
         */
        const offsetFrom = (selector: string, block: 'start' | 'center') => browser.execute((selector, block) => {
            const rect = document.querySelector(selector)!.getBoundingClientRect()
            return Math.abs(block === 'start' ? rect.top : rect.top + rect.height / 2 - window.innerHeight / 2)
        }, selector, block)

        for (const block of ['start', 'center'] as const) {
            it(`aligns an element that a component renders when it becomes visible, with block ${block}`, async () => {
                const elem = await $('#far')
                await browser.execute(() => {
                    // room below, so the page can scroll the element to its block position
                    document.body.insertAdjacentHTML('beforeend', '<div style="height: 3000px"></div>')
                    const observer = new IntersectionObserver((entries) => {
                        if (entries.some((entry) => entry.isIntersecting)) {
                            observer.disconnect()
                            ;(window as unknown as Fixture).renderFar()
                        }
                    })
                    observer.observe(document.querySelector('#far')!)
                })
                await elem.scrollIntoView({ block })

                expect(await offsetFrom('#far', block)).toBeLessThanOrEqual(2)
            })
        }

        it('throws for an element off screen that its scroll removes', async () => {
            const elem = await $('#far')
            await browser.execute(() => window.addEventListener('scroll', () => document.querySelector('#far')?.remove()))

            expect((await errorOf(elem.scrollIntoView()))?.message).toContain("element wasn't found")
        })

        it('scrolls an item of $$ in a list that renders all its rows again on each scroll', async () => {
            await browser.execute(() => {
                document.querySelector('#far-area')!.insertAdjacentHTML('beforeend',
                    `<ul id="rows">${[0, 1, 2, 3, 4].map((i) => `<li class="row">row ${i}</li>`).join('')}</ul>`)
                const rows = document.querySelector('#rows')!
                window.addEventListener('scroll', () => {
                    rows.replaceChildren(...[...rows.children].map((row) => row.cloneNode(true)))
                })
            })
            const row = await $$('.row')[3]
            await row.scrollIntoView()

            expect(await isInView('.row', { index: 3 })).toBe(true)
        })

        it('scrolls an element of a parent that renders again on each scroll', async () => {
            await browser.execute(() => {
                document.querySelector('#far-area')!.insertAdjacentHTML('beforeend',
                    `<ul id="rows">${[0, 1, 2, 3, 4].map((i) => `<li class="row">row ${i}</li>`).join('')}</ul>`)
                window.addEventListener('scroll', () => {
                    const rows = document.querySelector('#rows')!
                    rows.replaceWith(rows.cloneNode(true))
                })
            })
            const row = await $('#rows').$('li:nth-child(4)')
            await row.scrollIntoView()

            expect(await isInView('.row', { index: 3 })).toBe(true)
        })

        it('scrolls an element in a shadow root that renders again on each scroll', async () => {
            await browser.execute(() => {
                const host = document.createElement('div')
                host.id = 'scroll-host'
                host.attachShadow({ mode: 'open' }).innerHTML = '<p class="target">in shadow</p>'
                document.querySelector('#far-area')!.append(host)
                window.addEventListener('scroll', () => {
                    host.shadowRoot!.innerHTML = '<p class="target">in shadow</p>'
                })
            })
            const elem = await $('#scroll-host').shadow$('.target')
            await elem.scrollIntoView()

            expect(await isInView('.target', { host: '#scroll-host' })).toBe(true)
        })

        it('scrolls an element in a nested scroll container that renders it again on each scroll', async () => {
            await browser.execute(() => {
                document.body.insertAdjacentHTML('afterbegin',
                    '<div id="box" style="height: 150px; overflow: auto"><div style="height: 1000px"></div><p id="deep">deep</p></div>')
                const box = document.querySelector('#box')!
                box.addEventListener('scroll', () => {
                    const deep = box.querySelector('#deep')!
                    deep.replaceWith(deep.cloneNode(true))
                })
            })
            const elem = await $('#deep')
            await elem.scrollIntoView()

            expect(await isInView('#deep', { container: '#box' })).toBe(true)
        })

        it('scrolls an element in a nested scroll container lower on the page that renders it again on each scroll', async () => {
            await browser.execute(() => {
                // the window delta of the element is more than the box height: the wheel scrolls it out of the box
                document.body.insertAdjacentHTML('afterbegin', '<div style="height: 300px"></div>' +
                    '<div id="box" style="height: 100px; overflow: auto"><div style="height: 1000px"></div><p id="deep">deep</p><div style="height: 1000px"></div></div>')
                const box = document.querySelector('#box')!
                box.addEventListener('scroll', () => {
                    const deep = box.querySelector('#deep')!
                    deep.replaceWith(deep.cloneNode(true))
                })
            })
            const elem = await $('#deep')
            await elem.scrollIntoView()

            expect(await isInView('#deep', { container: '#box' })).toBe(true)
        })
    })

    /**
     * A command runs again with the id of the element that was found again, not with the stale id
     */
    describe('a command that gets the element id', () => {
        it('setValue sets a date input that the page rendered again directly', async () => {
            const input = await $('#form .date')
            expect(input.elementId).toBeDefined()

            await renderForm('replaced')
            await input.setValue('2026-10-17')
            await expect($('#form .date')).toHaveValue('2026-10-17')
        })

        it('a protocol command gets the id of the element that was found again', async () => {
            const elem = await $('.in-form')
            await expect(elem.getText()).resolves.toBe('first')

            await renderForm('replaced')
            await expect(elem.getElementText(elem.elementId)).resolves.toBe('replaced')
        })

        it('setValue sets a date input in a shadow host that the page replaced', async () => {
            const input = await $('#date-host').shadow$('.date')
            expect(input.elementId).toBeDefined()

            await renderDateHost()
            await input.setValue('2026-10-17')
            await expect($('#date-host').shadow$('.date')).toHaveValue('2026-10-17')
        })

        it('setValue sets a date input of a $$ list that the page rendered again', async () => {
            const input = (await $$('#dates .date'))[1]
            expect(input.elementId).toBeDefined()

            await renderDates()
            await input.setValue('2026-10-17')
            expect(await browser.execute(() => [...document.querySelectorAll<HTMLInputElement>('#dates .date')].map((el) => el.value)))
                .toEqual(['', '2026-10-17'])
        })

        it('setValue replaces the text of an input that the page renders again with its old text after the clear', async () => {
            const input = await $('#restore')
            expect(input.elementId).toBeDefined()

            await input.setValue('new')
            await expect($('#restore')).toHaveValue('new')
        })

        /**
         * `selectBy*` finds the option again from the select that was found again, so its click
         * gets a new option id. The unit test "keeps the id of another element in the retry of a
         * protocol command" checks that a retry on the select keeps the id of the option
         */
        it('selectByVisibleText selects in a select that the page rendered again', async () => {
            const select = await $('#select')
            expect(select.elementId).toBeDefined()

            await renderSelect()
            await select.selectByVisibleText('Beta')
            await expect($('#select')).toHaveValue('b')
        })
    })

    it('a stale element of a held browsing context is found again in that context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        const page = await browser.url(FIXTURE)
        const elem = await page.$('.item')
        await expect(elem.getText()).resolves.toBe('first')

        await renderItems(['replaced'])
        await expect(elem.getText()).resolves.toBe('replaced')
    })
})
