import { expect } from 'expect'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'

// @ts-expect-error cwd based import checks need to be implemented
import App from '/browser-runner/components/ReactComponent.jsx'

describe('React Component Testing', () => {
    it('Test theme button toggle', async () => {
        render(<App />)
        const buttonEl = screen.getByText(/Current theme/i)

        await userEvent.click(buttonEl)
        expect(buttonEl.innerText).toContain('dark')
    })
})
