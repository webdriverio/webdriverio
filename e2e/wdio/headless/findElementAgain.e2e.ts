import url from 'node:url'
import path from 'node:path'
import { browser, $, $$, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

interface Fixture {
    renderLate (count: number): void
    renderItems (texts: string[]): void
    renderShadow (className: string, texts: string[]): void
    renderForm (text: string): void
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
