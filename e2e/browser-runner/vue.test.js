import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'

import Component from './components/Component.vue'

describe('Vue Component Testing', () => {
    it('increments value on click with single element', async () => {
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
        await expect(await $('p=Times clicked: 2')).toExist()

        await expect($('p=Times clicked: 123')).not.toExist()
        await expect(await $('p=Times clicked: 123')).not.toExist()

        await expect($('p=Times clicked: 2')).toBeDisplayed()
        await expect(await $('p=Times clicked: 2')).toBeDisplayed()

        await expect($('p=Times clicked: 123')).not.toBeDisplayed()
        await expect(await $('p=Times clicked: 123')).not.toBeDisplayed()
    })

    it('increments value on click with multi-elements', async () => {
        const { getByText } = render(Component)
        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2')

        await expect($$('p=Times clicked: 2')).toExist()
        await expect(await $$('p=Times clicked: 2')).toExist()

        await expect($$('p=Times clicked: 123')).not.toExist()
        await expect(await $$('p=Times clicked: 123')).not.toExist()

        await expect($$('p=Times clicked: 2')).toBeDisplayed()
        await expect(await $$('p=Times clicked: 2')).toBeDisplayed()
    })

    it('support multi-elements special empty array case', async () => {
        render(Component)

        // EXPECTED BEHAVIOR: Fails since we have no elements and cannot assert if it is displayed or not
        await expect(expect($$('p=Times clicked: 123')).not.toBeDisplayed()).rejects.toThrow(/"at least one result"/)
        await expect(expect($$('p=Times clicked: 123')).not.toBeDisplayed()).rejects.toThrow(/"at least one result"/)
    })

    const featureFlags = { featureFlags: { useToHaveTextStrictMultiElementsCompareStrategy : true } }

    // TODO the below fails with `path.isAbsolute is not a function` because of `jest-message-util` using path, we might need path-browserify
    it.skip('support toHaveText with single element in legacy mode', async () => {
        await expect(async () => Promise.reject(new Error('test'))).rejects.toThrow('teste')
    })

    it('support toHaveText with single element in strict mode', async () => {
        await render(Component)

        // New strict mode
        await expect($('p=Times clicked: 0')).toHaveText('Times clicked: 0', featureFlags)
        await expect($('p=Times clicked: 0')).toHaveText(expect.stringContaining('Times clicked'), featureFlags)
        await expect($('p=Times clicked: 0')).toHaveText(['Times clicked: 0', 'Times clicked: 1'], featureFlags)
        await expect($('p=Times clicked: 0')).toHaveText([expect.stringContaining('Times clicked'), 'Times clicked: 1'], featureFlags)
        await expect($('p=Times clicked: 0')).toHaveText(expect.oneOf('Times clicked: 0', 'Times clicked: 1'), featureFlags)
        await expect($('p=Times clicked: 0')).toHaveText(expect.oneOf(expect.stringContaining('Times clicked'), 'Times clicked: 1'), featureFlags)
    })

    it('support toHaveText with multi-elements in legacy mode', async () => {
        await render(Component)

        // Legacy
        await expect($$('p=Times clicked: 0')).toHaveText('Times clicked: 0')
        await expect(await $$('p=Times clicked: 0')).toHaveText('Times clicked: 0')
        await expect($$('p=Times clicked: 0')).toHaveText(expect.stringContaining('Times clicked'))
        await expect($$('p=Times clicked: 0')).toHaveText(['Times clicked: 0'])
        await expect($$('p=Times clicked: 0')).toHaveText(expect.oneOf('Times clicked: 0', 'Times clicked: 1'))
        await expect($$('p=Times clicked: 0')).toHaveText(expect.oneOf(expect.stringContaining('Times clicked'), 'Times clicked: 1'))
    })

    it('support toHaveText with multi-elements in strict mode', async () => {
        await render(Component)

        // New strict mode
        await expect($$('p=Times clicked: 0')).toHaveText('Times clicked: 0', featureFlags)
        await expect(await $$('p=Times clicked: 0')).toHaveText('Times clicked: 0', featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText(expect.stringContaining('Times clicked'), featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText(['Times clicked: 0'], featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText(expect.oneOf('Times clicked: 0', 'Times clicked: 1'), featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText(expect.oneOf(expect.stringContaining('Times clicked'), 'Times clicked: 1'), featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText([expect.stringContaining('Times clicked')], featureFlags)
        await expect($$('p=Times clicked: 0')).toHaveText([expect.oneOf('Times clicked: 0', 'Times clicked: 1')], featureFlags)
        await expect(expect.some($$('p=Times clicked: 0'))).toHaveText(expect.oneOf('Times clicked: 0', 'Times clicked: 1'), featureFlags)
        await expect($$('p=Times clicked: 0').filter(element => element.isExisting())).toHaveText('Times clicked: 0', featureFlags)
        await expect(await $$('p=Times clicked: 0').filter(element => element.isExisting())).toHaveText('Times clicked: 0', featureFlags)
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
