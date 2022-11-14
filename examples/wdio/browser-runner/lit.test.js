import { $, expect } from '@wdio/globals'
import './components/LitComponent.ts'

describe('Lit Component testing', () => {
    it('should render component', async () => {
        const elem = document.createElement('simple-greeting')
        elem.setAttribute('name', 'WebdriverIO')
        document.body.appendChild(elem)

        const innerElem = await $(elem).$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO!')
    })
})
