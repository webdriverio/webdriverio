import { $, expect } from '@wdio/globals'
import { render } from '@wdio/browser-runner/stencil'

import { AppProfile } from './components/StencilComponent.jsx'
import { NestedComponent } from './components/StencilComponentNested.jsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        render({
            components: [AppProfile, NestedComponent],
            autoApplyChanges: true,
            template: () => (
                // @ts-ignore: types don't exist as we don't compile the components with Stencil
                <app-profile match={{ params: { name: 'stencil' } }}></app-profile>
            )
        })
        await expect($('>>>.app-profile')).toHaveText(
            expect.stringContaining('Hello! My name is Stencil.')
        )

        /**
         * this assertion for Safari due to: https://github.com/w3c/webdriver/issues/1786
         */
        // eslint-disable-next-line no-undef
        if ((browser.capabilities as WebdriverIO.Capabilities).browserName?.toLowerCase() !== 'safari') {
            await expect($('>>>.app-profile')).toHaveText(
                expect.stringContaining('I am a nested component!')
            )
        }

        await expect($('>>>.app-profile').getCSSProperty('font-weight'))
            .toMatchInlineSnapshot(`
          {
            "parsed": {
              "string": "700",
              "type": "number",
              "unit": "",
              "value": 700,
            },
            "property": "font-weight",
            "value": 700,
          }
        `)
    })
})
