import { browser, expect, $ } from '@wdio/globals'
import { spyOn, mock, fn, unmock } from '@wdio/browser-runner'
import { html, render } from 'lit'
import isUrl from 'is-url'

import defaultExport, { namedExportValue } from 'someModule'
import namespacedModule from '@namespace/module'
import { someExport, namedExports, someFunction } from '@testing-library/user-event'

/**
 * a CJS module
 */
import stringWidth from 'string-width'

import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')
mock('./components/constants.ts', async (mod) => {
    return {
        GREETING: mod.GREETING + ' Sir'
    }
})

mock('string-width', () => ({
    default: () => 123
}))

mock('graphql-request', () => ({
    gql: fn(),
    GraphQLClient: class GraphQLClientMock {
        request = fn().mockResolvedValue({ result: 'Thanks for your answer!' })
    }
}))

mock('@testing-library/user-event', async (mod) => {
    return {
        someExport: 'foobarloo',
        namedExports: Object.keys(mod),
        someFunction: fn()
            .mockReturnValueOnce('first')
            .mockReturnValueOnce('second')
            .mockReturnValueOnce('third')
    }
})

unmock('is-url')
mock('@namespace/module')

describe('Lit Component testing', () => {
    it('recognises require files', () => {
        expect(window.globalSetupScriptExecuted).toBe(true)
        expect(window.mochaGlobalSetupExecuted).toBe(true)
    })

    it('should render component', async function () {
        /**
         * only run snapshot tests in non-Safari browsers as shadow dom piercing
         * is not yet supported in Safari
         */
        if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
            return
        }

        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! How are you today?')
    })

    it('should render with mocked component function', async function () {
        /**
         * only run snapshot tests in non-Safari browsers as shadow dom piercing
         * is not yet supported in Safari
         */
        if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
            return
        }

        getQuestionFn.mockReturnValue('Does this work?')
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! Does this work?')
    })

    it('does not stale on elements not found', async () => {
        const start = Date.now()
        await expect($('non-existing-element')).not.toBePresent()
        await expect($('non-existing-element')).not.toBeDisplayed()
        await expect(await $('non-existing-element')).not.toBePresent()
        await expect(await $('non-existing-element')).not.toBeDisplayed()
        expect(Date.now() - start).toBeLessThan(1000)
    })

    describe('shadow root piercing', function () {
        it('should allow to pierce into closed shadow roots', async function () {
            /**
             * only run snapshot tests in non-Safari browsers as shadow dom piercing
             * is not yet supported in Safari
             */
            if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
                return this.skip()
            }

            render(
                html`<closed-node>Hello, </closed-node>`,
                document.body
            )
            await expect($('.findMe')).toHaveText('I am hidden!')
            /**
             * Note: the `getText` command doesn't expose text from closed shadow roots
             */
            const closedNode = $('closed-node')
            await expect(closedNode).toHaveText('Hello,')
            await expect(closedNode).toMatchInlineSnapshot(`
              "<closed-node>Hello,
                <template shadowrootmode="closed">
                  <style>section { color: blue; }</style>
                  <h2>Closed Node</h2>
                  <section>
                    <slot></slot>
                    <closed-node-nested>hidden
                      <template shadowrootmode="closed">
                        <style>.findMe { color: green; }</style>
                        <h2>Deep Closed Node</h2>
                        <div class="findMe">I am
                          <slot></slot>!</div>
                      </template>
                    </closed-node-nested>
                  </section>
                </template>
              </closed-node>"
            `)
        })

        it('can fetch multiple elements within various closed shadow roots', async function () {
            /**
             * only run snapshot tests in non-Safari browsers as shadow dom piercing
             * is not yet supported in Safari
             */
            if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
                return this.skip()
            }

            render(
                html`<closed-node>Hello, </closed-node>`,
                document.body
            )
            const root = $('closed-node')
            await expect(root.$('h2')).toHaveText('Closed Node')
            expect(await root.$$('h2').map((h2) => h2.getText())).toEqual([
                'Closed Node',
                'Deep Closed Node'
            ])
        })
    })

    describe('snapshot testing', () => {
        beforeEach(() => {
            render(
                html`<simple-greeting name="WebdriverIO" />`,
                document.body
            )
        })

        it('of elements', async () => {
            /**
             * only run snapshot tests in non-Safari browsers as shadow dom piercing
             * is not yet supported in Safari
             */
            if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
                return
            }

            const elem = $('simple-greeting')
            await expect(elem).toMatchSnapshot()
            await expect(elem).toMatchInlineSnapshot(`
              "<simple-greeting name="WebdriverIO">
                <template shadowrootmode="open">
                  <style>:host { color: blue; }</style>
                  <div>
                    <p>Hello Sir, WebdriverIO! Does this work?</p>
                    <button>Good</button>
                    <hr />
                    <em></em>
                    <sub-elem>
                      <template shadowrootmode="open">
                        <style>.selectMeToo { color: blue; }</style>
                        <div>
                          <p class="selectMe">I am within another shadow root element</p>
                          <p class="selectMeToo">I am within another shadow root element as well</p>
                        </div>
                      </template>
                    </sub-elem>
                  </div>
                </template>
              </simple-greeting>"
            `)
        })

        it('of objects', async () => {
            const elem = $('simple-greeting')
            await expect(elem.getCSSProperty('background-color')).toMatchSnapshot()
            await expect(elem.getCSSProperty('background-color')).toMatchInlineSnapshot(`
              {
                "parsed": {
                  "alpha": 0,
                  "hex": "#000000",
                  "rgba": "rgba(0,0,0,0)",
                  "type": "color",
                },
                "property": "background-color",
                "value": "rgba(0,0,0,0)",
              }
            `)
            await expect({ foo: 'bar' }).toMatchSnapshot()
            await expect({ foo: 'bar' }).toMatchInlineSnapshot(`
              {
                "foo": "bar",
              }
            `)
        })

        it('should be able to fetch elements that created without registering to the element registry', async () => {
            /**
             * only run snapshot tests in non-Safari browsers as shadow dom piercing
             * is not yet supported in Safari
             */
            if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
                return
            }

            const shadowResult = await browser.execute(() => {
                const shadowElement = document.createElement('div')
                shadowElement.id = 'helloshadow'
                document.body.appendChild(shadowElement)

                const shadowCreated = shadowElement.attachShadow({ mode: 'open' })
                shadowCreated.innerHTML = '<p id=\'shadowelement\'>Hello World</p>'
                const shadowExists = document.querySelector('#helloshadow')?.shadowRoot
                return shadowExists ? 'created' : 'failed'
            })
            expect(shadowResult).toBe('created')
            const shadowRoot = await browser.execute(() =>
                Boolean(document.querySelector('#helloshadow')?.shadowRoot)
            )
            expect(shadowRoot).toBe(true)
            const shadowElement = await browser.execute(() =>
                Boolean(document.querySelector('#helloshadow')?.shadowRoot?.querySelector('#shadowelement'))
            )
            expect(shadowElement).toBe(true)
            await browser.$('#helloshadow').waitForDisplayed()
            await browser.$('#shadowelement').waitForExist()
        })
    })

    it('maps the driver response when the element is not interactable so that we shown an aligned message with the best information we can', async () => {
        render(
            html`<input style="display: none;" />`,
            document.body
        )

        const err = await $('input').click().catch((err) => err)
        expect(err.name).toBe('webdriverio(middleware): element did not become interactable')
        expect(err.message).toBe('Element <input style="display: none;" /> did not become interactable')
    })

    it('intercepts "element not interactable" errors and waits for the element to be interactable', async () => {
        render(
            html`<input style="display: none;" />`,
            document.body
        )

        setTimeout(() => {
            document.querySelector('input').setAttribute('style', '')
        }, 1000)

        await $('input').click()
    })

    it('intercepts "element not interactable" errors and waits for the element in array to be interactable', async () => {
        render(
            html`<input style="display: none;" />`,
            document.body
        )

        setTimeout(() => {
            document.querySelector('input').setAttribute('style', '')
        }, 1000)

        await $$('input')[0].click()
    })

    it('should allow to auto mock dependencies', () => {
        expect(defaultExport).toBe('barfoo')
        expect(namedExportValue).toBe('foobar')
        expect(namespacedModule).toBe('some value')
    })

    it('should allow to manual mock namespaces deps', async () => {
        expect(someExport).toBe('foobarloo')
        expect(namedExports).toEqual(['PointerEventsCheckLevel', 'default', 'userEvent'])
    })

    it('should allow to have different mock return values', () => {
        expect(someFunction()).toBe('first')
        expect(someFunction()).toBe('second')
        expect(someFunction()).toBe('third')
        expect(someFunction()).toBe(undefined)
    })

    it('should allow to mock CJS modules', () => {
        expect(stringWidth('a')).toBe(123)
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
        await $('simple-greeting').$('button').click()
        await expect($('simple-greeting').$('em')).toHaveText('Thanks for your answer!')
    })

    it('should call execute method with the element', async function () {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )
        const result = await $('simple-greeting').execute((elem, a, b, c) => {
            return `${elem.outerHTML}, ${a}, ${b}, ${c}`
        }, 1, 2, 3)
        await expect(result).toEqual('<simple-greeting name="WebdriverIO"></simple-greeting>, 1, 2, 3')
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
        const getHTMLOptions = { includeSelectorTag: false, prettify: false }

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
            expect(await $('div.foo*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('.foo*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('div#bar*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('#bar*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
        })

        const outerClassLists = ['foo', 'bar foo', 'foo bar baz', 'bar foo baz', 'bar baz foo']
        const innerClassLists = ['foo-bar-baz', 'bar-foo-baz', 'bar-baz-foo']
        for (const outerClassList of outerClassLists) {
            for (const innerClassList of innerClassLists) {
                it(`fetches element by content correctly with nested class names where the inner classlist is "${innerClassList}" and the outer classlist is "${outerClassList}"`, async () => {
                    render(
                        html`<div class="${outerClassList}"><div class="${innerClassList}"></div><div><div>Find me</div></div></div>`,
                        document.body
                    )
                    expect(await $('.foo*=Find').getHTML(getHTMLOptions)).toBe(`<div class="${innerClassList}"></div><div><div>Find me</div></div>`)
                })
            }
        }

        it('fetches element by content correctly with nested class names', async () => {
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
            expect(await $('div.foo*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('.foo*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('div#bar*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('#bar*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
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
            expect(await $('[data-testid="foobar"]*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('[data-testid]*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('div[data-testid="foobar"]*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
            expect(await $('div[data-testid]*=me').getHTML(getHTMLOptions)).toBe('<div><span>Find me</span></div>')
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

        it('can save a screenshot', async () => {
            expect((await browser.saveScreenshot('./screenshot.png')).type)
                .toBe('Buffer')
        })

        it('can save a pdf', async () => {
            /**
             * Safari does not support 'POST /session/<sessionId>/print' command
             */
            if (browser.capabilities.browserName.toLowerCase() === 'safari') {
                return
            }
            expect((await browser.savePDF('./screenshot.pdf')).type)
                .toBe('Buffer')
        })

        it('supports custom command registration in before hook', async () => {
            expect(await browser.someCustomCommand()).toBe('Hello World')
        })

        it('supports custom matchers added by services', async () => {
            await expect('foo').toBeFoo()

            let error
            try {
                await expect('bar').toBeFoo()
            } catch (err) {
                error = err
            }

            expect(error.message).toBe('expected bar to be foo')
        })

        it('should support nested element calls', async function () {
            render(
                html`<section>
                    <div class="first">
                        <ul>
                            <li>First</li>
                            <li>Second</li>
                            <li>Third</li>
                        </ul>
                    </div>
                    <div class="second">
                        <ul>
                            <li>2nd First</li>
                            <li>2nd Second</li>
                            <li>2nd Third</li>
                            <li>2nd Fourth</li>
                            <li>2nd Fifth</li>
                        </ul>
                    </div>
                </section>`,
                document.body
            )
            const first = $('.first').$$('li')
            await expect(first).toBeElementsArrayOfSize(3)
            await expect(first[0]).toHaveText('First')
            await expect(first[1]).toHaveText('Second')
            await expect(first[2]).toHaveText('Third')
            const second = $('.second').$$('li')
            await expect(second).toBeElementsArrayOfSize(5)
            await expect(second[0]).toHaveText('2nd First')
            await expect(second[1]).toHaveText('2nd Second')
            await expect(second[2]).toHaveText('2nd Third')
            await expect(second[3]).toHaveText('2nd Fourth')
            await expect(second[4]).toHaveText('2nd Fifth')
            const nestedElement = $('.second').$('li')
            await expect(nestedElement).toHaveText('2nd First')
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

            it('images with an alt tag', async () => {
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
                        <input type="text" placeholder="Find me">
                        <textarea placeholder="Find me"></textarea>
                    `,
                    document.body
                )
                await expect($$('aria/Find me')).toBeElementsArrayOfSize(2)
            })

            it('aria label is received by an input aria-placeholder', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <input type="text" aria-placeholder="Find me">
                        <textarea aria-placeholder="Find me"></textarea>
                    `,
                    document.body
                )
                await expect($$('aria/Find me')).toBeElementsArrayOfSize(2)
            })

            /**
             * fails due to https://github.com/webdriverio/webdriverio/issues/8826
             */
            it('input with a label', async () => {
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

            it('multiple inputs with a label', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label for="search-1">Search 1</label>
                        <input id="search-1" type="text" value="Hello World! 1" />
                        <label for="search-2">Search 2</label>
                        <input id="search-2" type="text" value="Hello World 2" />
                    `,
                    document.body
                )
                const elem1 = await $('aria/Search 1')
                await expect(elem1).toHaveValue('Hello World! 1')
                const elem2 = await $('aria/Search 2')
                await expect(elem2).toHaveValue('Hello World 2')
            })

            it('textarea with a label', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label for="search">Search</label>
                        <textarea id="search">Hello World!</textarea>
                    `,
                    document.body
                )
                const elem = await $('aria/Search')
                await expect(elem).toHaveValue('Hello World!')
            })

            it('multiple textareas with a label', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label for="search-1">Search 1</label>
                        <textarea id="search-1">Hello World! 1</textarea>
                        <label for="search-2">Search 2</label>
                        <textarea id="search-2">Hello World 2</textarea>
                    `,
                    document.body
                )
                const elem1 = await $('aria/Search 1')
                await expect(elem1).toHaveValue('Hello World! 1')
                const elem2 = await $('aria/Search 2')
                await expect(elem2).toHaveValue('Hello World 2')
            })

            it('input with a label as parent', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label>
                            Search
                            <input type="text" value="Hello World!" />
                        </label>
                    `,
                    document.body
                )
                const elem = await $('aria/Search')
                await expect(elem).toHaveValue('Hello World!')
            })

            it('multiple inputs with a label as parent', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label>
                            Search 1
                            <input type="text" value="Hello World! 1" />
                        </label>
                        <label>
                            Search 2
                            <input type="text" value="Hello World! 2" />
                        </label>
                    `,
                    document.body
                )
                const elem1 = await $('aria/Search 1')
                await expect(elem1).toHaveValue('Hello World! 1')
                const elem2 = await $('aria/Search 2')
                await expect(elem2).toHaveValue('Hello World! 2')
            })

            it('textarea with a label as parent', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label>
                            Search
                            <textarea>Hello World!</textarea>
                        </label>
                    `,
                    document.body
                )
                const elem = await $('aria/Search')
                await expect(elem).toHaveValue('Hello World!')
            })

            it('multiple textareas with a label as parent', async () => {
                // https://www.w3.org/TR/accname-1.1/#step2D
                render(
                    html`
                        <label>
                            Search 1
                            <textarea>Hello World! 1</textarea>
                        </label>
                        <label>
                            Search 2
                            <textarea>Hello World! 2</textarea>
                        </label>
                    `,
                    document.body
                )
                const elem1 = await $('aria/Search 1')
                await expect(elem1).toHaveValue('Hello World! 1')
                const elem2 = await $('aria/Search 2')
                await expect(elem2).toHaveValue('Hello World! 2')
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

    it('should support WASM', async () => {
        const source = fetch('/browser-runner/wasm/add.wasm')
        const wasmModule = await WebAssembly.instantiateStreaming(source)
        expect(wasmModule.instance.exports.add(1, 2)).toBe(3)
    })

    it('should allow to re-fetch elements', async () => {
        let i = 0
        const stage = document.createElement('div')
        stage.id = 'stage'
        document.body.appendChild(stage)

        setInterval(async () => {
            const span = document.createElement('span')
            span.textContent = 'Hello, world! ' + ++i
            stage.appendChild(span)
        }, 500)
        await expect($('#stage').$$('span')[4]).toHaveText('Hello, world! 5')
    })

    it('can initiate web component elements with new keyword', () => {
        class Foo extends HTMLElement { }
        customElements.define('x-foo', Foo)
        const a = new Foo()
        expect(a.tagName).toBe('X-FOO')
    })

    it('connectedCallback should not fail if no original connectedCallback is defined', function () {
        // only in bidi the customElementWrapper is not available
        if (!browser.isBidi) {
            return this.skip()
        }

        class Foo extends HTMLElement { }
        customElements.define('y-foo', Foo)
        const a = new Foo()
        a.connectedCallback()
    })

    it('disConnectedCallback should not fail if no original disConnectedCallback is defined', function () {
        // only in bidi the customElementWrapper is not available
        if (!browser.isBidi) {
            return this.skip()
        }
        class Foo extends HTMLElement { }
        customElements.define('z-foo', Foo)
        const a = new Foo()
        a.disconnectedCallback()
    })
})
