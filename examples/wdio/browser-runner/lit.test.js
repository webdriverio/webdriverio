import expect from 'expect'
import { waitFor } from '@testing-library/dom'
import '/browser-runner/components/LitComponent.ts'

describe('Lit Component testing', () => {
    it('should render component', async () => {
        const elem = document.createElement('simple-greeting')
        elem.setAttribute('name', 'WebdriverIO')
        document.body.appendChild(elem)

        await waitFor(() => {
            expect(elem.shadowRoot.textContent).toBe('Hello, WebdriverIO!')
        })
    })
})
