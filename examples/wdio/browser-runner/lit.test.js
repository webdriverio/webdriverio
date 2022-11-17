import { expect, $ } from '@wdio/globals'
import { html, render } from 'lit'
import './components/LitComponent.ts'

describe('Lit Component testing', () => {
    it('should render component', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO!')
    })
})
