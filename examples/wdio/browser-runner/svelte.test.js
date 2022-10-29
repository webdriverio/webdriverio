import expect from 'expect'

import { render, fireEvent, screen } from '@testing-library/svelte'
import '@testing-library/jest-dom'

import Comp from './components/Component.svelte'

describe('Svelte Component Testing', () => {
    it('shows proper heading when rendered', () => {
        render(Comp, { name: 'World' })
        const heading = screen.getByText('Hello World!')
        expect(heading).toBeInTheDocument()
    })

    it('changes button text on click', async () => {
        render(Comp, { name: 'World' })
        const button = screen.getByRole('button')
        await fireEvent.click(button)
        expect(button).toHaveTextContent('Button Clicked')
    })
})
