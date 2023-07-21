import { expect, $ } from '@wdio/globals'
import { spyOn, mock, fn, unmock } from '@wdio/browser-runner'
import { html, render } from 'lit'
import isUrl from 'is-url'

import defaultExport, { namedExportValue } from 'someModule'
import namespacedModule from '@namespace/module'
import { someExport, namedExports } from '@testing-library/user-event'

import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')
mock('./components/constants.ts', async (mod) => {
    return {
        GREETING: mod.GREETING + ' Sir'
    }
})

mock('graphql-request', () => ({
    gql: fn(),
    GraphQLClient: class GraphQLClientMock {
        request = fn().mockResolvedValue({ result: 'Thanks for your answer!' })
    }
}))

mock('@testing-library/user-event', async (mod) => {
    return {
        someExport: 'foobarloo',
        namedExports: Object.keys(mod)
    }
})

unmock('is-url')
mock('@namespace/module')

describe('Lit Component testing', () => {
    it('recognises require files', () => {
        expect(window.globalSetupScriptExecuted).toBe(true)
        expect(window.mochaGlobalSetupExecuted).toBe(true)
    })

    it('should render component', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! How are you today?')
    })

    it('should render with mocked component function', async () => {
        getQuestionFn.mockReturnValue('Does this work?')
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! Does this work?')
    })

    it('should allow to auto mock dependencies', () => {
        expect(defaultExport).toBe('barfoo')
        expect(namedExportValue).toBe('foobar')
        expect(namespacedModule).toBe('some value')
    })

    it('should allow to manual mock namespaces deps', async () => {
        expect(someExport).toBe('foobarloo')
        expect(namedExports).toEqual(['PointerEventsCheckLevel', 'default'])
    })

    it('should allow to unmock', () => {
        expect(isUrl).not.toBe('mocked value')
    })

    it('should have access to globals', () => {
        expect(process.env.WDIO_PRESET).toBe('lit')
        expect(window.WDIO_ENV_TEST).toBe('passed')
        expect(window.TEST_COMMAND).toBe('serve')
    })

    it('should allow to manual mock dependencies', async function () {
        /**
         * this fails in Safari as the click on the button is not recognised
         */
        if (browser.capabilities.browserName.toLowerCase() === 'safari') {
            return this.skip()
        }

        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )
        await $('simple-greeting').$('>>> button').click()
        await expect($('simple-greeting').$('>>> em')).toHaveText('Thanks for your answer!')
    })

    it('should be able to chain shadow$ commands', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )
        await expect($('simple-greeting').shadow$('sub-elem').shadow$('.selectMe'))
            .toHaveText('I am within another shadow root element')

        const pText = await $('simple-greeting')
            .shadow$('sub-elem')
            .shadow$$('p')
            .map((elem) => elem.getText())
        expect(pText).toEqual([
            'I am within another shadow root element',
            'I am within another shadow root element as well'
        ])
    })

    it('should be able to check if element found by shadow$ and shadow$$ is present', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )
        await expect($('simple-greeting').shadow$('sub-elem').shadow$('.selectMe')).toBePresent()
        await expect($('simple-greeting').shadow$('sub-elem').shadow$$('.selectMe')[0]).toBePresent()
    })

    it('should not stale process due to alert or prompt', async () => {
        alert('test')
        prompt('test')
        confirm('test')
        await expect(browser).toHaveTitle('WebdriverIO Browser Test')
    })

    describe('Selector Tests', () => {
        it('fetches element by content correctly', async () => {
            render(
                html`<div><div><div>Find me</div></div></div>`,
                document.body
            )
            expect(await $('div=Find me').getHTML(false)).toBe('Find me')
            expect(await $('div*=me').getHTML(false)).toBe('Find me')
        })

        it('fetches inner element by content correctly', async () => {
            render(
                html`<div><div><span>Find me</span></div></div>`,
                document.body
            )
            expect(await $('div*=me').getHTML(false)).toBe('<span>Find me</span>')
        })

        it('fetches inner element by content correctly with class names', async () => {
            render(
                html`<div class="foo" id="#bar"><div><span>Find me</span></div></div>`,
                document.body
            )
            expect(await $('div.foo*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('.foo*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('div#bar*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('#bar*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
        })

        it('fetches inner element by content correctly with nested class names', async () => {
            /**
             * <div class="foo" id="#bar">
             *     <div>
             *         <div class="foo" id="#bar">
             *             <div>
             *                 <span>Find me</span>
             *             </div>
             *         </div>
             *     </div>
             * </div>
             */
            render(
                html`
                <div class="foo" id="#bar"><div><div class="foo" id="#bar"><div><span>Find me</span></div></div></div></div>`,
                document.body
            )
            expect(await $('div.foo*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('.foo*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('div#bar*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('#bar*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
        })

        it('fetches inner element by content correctly with nested attribute selector', async () => {
            /**
             * <div data-testid="foobar">
             *     <div>
             *         <div data-testid="foobar">
             *             <div>
             *                 <span>Find me</span>
             *             </div>
             *         </div>
             *     </div>
             * </div>
             */
            render(
                html`
                <div data-testid="foobar"><div><div data-testid="foobar"><div><span>Find me</span></div></div></div></div>`,
                document.body
            )
            expect(await $('[data-testid="foobar"]*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('[data-testid]*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('div[data-testid="foobar"]*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
            expect(await $('div[data-testid]*=me').getHTML(false)).toBe('<div><span>Find me</span></div>')
        })

        it('fetches the parent element by content correctly', async () => {
            render(
                html`<button><span>Click Me!</span></button>`,
                document.body
            )
            expect(await $('span=Click Me!').getHTML(false)).toBe('Click Me!')
            expect(await $('button=Click Me!').getHTML(false)).toBe('<span>Click Me!</span>')
            const elem = $('button=Click Me!')
            await expect(elem).toHaveText('Click Me!')
        })

        it('fetches the element with multiple text nodes by the content', async () => {
            const container = document.createElement('p')
            container.appendChild(document.createTextNode('Find'))
            container.appendChild(document.createTextNode(' me'))
            render(container, document.body)
            const elem = await $('p=Find me')
            await expect(elem).toHaveText('Find me')
        })

        it('fetches element by JS function', async () => {
            expect((await $(() => document.body).getTagName()).toLowerCase()).toBe('body')
        })

        describe('a11y selectors', () => {
            it('aria label is received from element content', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2B
                render(
                    html`<div><div><div>Find me</div></div></div>`,
                    document.body
                )
                expect(await $('aria/Find me').getHTML(false)).toBe('Find me')
            })

            it(' images with an alt tag', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`<img alt="foo" src="Find me">`,
                    document.body
                )
                await expect($('aria/foo')).toHaveAttribute('src', 'Find me')
            })

            it('aria label is received by its title attribute', async () => {
                // https://www.a11yproject.com/posts/title-attributes/
                render(
                    html`<img src="/you/got/it.png" alt="" title="Find me" />`,
                    document.body
                )
                await expect($('aria/Find me')).toHaveAttribute('src', '/you/got/it.png')
            })

            it('aria label is received by an input placeholder', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <input type="text" placeholder="Find me" />
                        <textarea placeholder="Find me" />
                    `,
                    document.body
                )
                expect(await $$('aria/Find me').length).toBe(2)
            })

            it('aria label is received by an input aria-placeholder', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <input type="text" aria-placeholder="Find me" />
                        <textarea aria-placeholder="Find me" />
                    `,
                    document.body
                )
                expect(await $$('aria/Find me').length).toBe(2)
            })

            /**
             * fails due to https://github.com/webdriverio/webdriverio/issues/8826
             */
            it.skip('inputs with a label', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label for="search">Search</label>
                        <input id="search" type="text" value="Hello World!" />
                    `,
                    document.body
                )
                const elem = await $('aria/Search')
                await expect(elem).toHaveValue('Hello World!')
            })

            it('aria label is recevied by other element with aria-labelledBy', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2B
                render(
                    html`
                        <button aria-labelledby="ref-1">Click Me!</button>
                        <div id="ref-1">Some Button</div>
                    `,
                    document.body
                )
                const elem = await $('aria/Some Button')
                await expect(elem).toHaveText('Click Me!')
            })

            it('aria label is recevied by other element with aria-describedby', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2B
                render(
                    html`
                        <button aria-describedby="ref-1">Click Me!</button>
                        <div id="ref-1">Some Button</div>
                    `,
                    document.body
                )
                const elem = await $('aria/Some Button')
                await expect(elem).toHaveText('Click Me!')
            })

            it('element has direct aria label', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2C
                render(
                    html`<div>
                        <button aria-label="FindMe">Click Me!</button>
                    </div>`,
                    document.body
                )
                const elem = await $('aria/FindMe')
                await expect(elem).toHaveText('Click Me!')
            })
        })
    })
})
