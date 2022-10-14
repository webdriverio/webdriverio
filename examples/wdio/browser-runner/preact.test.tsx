import { expect } from 'expect'
import { h } from 'preact'
import { render, fireEvent, screen, waitFor } from '@testing-library/preact'
import '@testing-library/jest-dom'

import { Counter } from '/browser-runner/components/Component.tsx'

describe('Counter', () => {
    it('should display initial count', () => {
        const { container } = render(<Counter initialCount={5} />)
        expect(container.textContent).toMatch('Current value: 5')
    })

    it('should increment after "Increment" button is clicked', async () => {
        render(<Counter initialCount={5} />)

        fireEvent.click(screen.getByText('Increment'))
        await waitFor(() => {
            // .toBeInTheDocument() is an assertion that comes from jest-dom.
            // Otherwise you could use .toBeDefined().
            expect(screen.getByText('Current value: 6')).toBeInTheDocument()
        })
    })
})
