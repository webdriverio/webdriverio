import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'

import Component from './components/Component.vue'

describe('Vue Component Testing', () => {
    it('increments value on click', async () => {
        // The render method returns a collection of utilities to query your component.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('Times clicked: 0')

        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2')
        await expect($('p=Times clicked: 2')).toExist()
        await expect($('p=Times clicked: 123')).not.toExist()
    })

    it('should support tailwindcss', async () => {
        const { getByText } = render(Component)
        const elem = await $(getByText('Times clicked: 0'))
        await expect(elem).toHaveStyle({ color: 'rgba(217,119,6,1)' })
    })

    it('supports @vue/test-utils', async () => {
        const wrapper = mount(Component, { attachTo: document.body })
        await $('aria/increment').click()
        expect(wrapper.text()).toContain('Times clicked: 1')
    })
})
