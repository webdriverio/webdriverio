import { expect, $ } from '@wdio/globals'
import { render } from '@testing-library/vue'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers as any)

import Component from '../../src/components/HelloWorld.vue'

describe('vue component tests', () => {
    it('should do something cool', async () => {
        // The render method returns a collection of utilities to query your component.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('count is 0')

        const button = await $(getByText('count is 0'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('count is 2')
        await expect(button).toHaveText('count is 2')
    })
})

