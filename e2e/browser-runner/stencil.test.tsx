import { $, browser, expect } from '@wdio/globals'
import { render, waitForChanges } from '@wdio/browser-runner/stencil'

import { AppProfile } from './components/StencilComponent.jsx'
import { NestedComponent } from './components/StencilComponentNested.jsx'
import { NoShadowComponent } from './components/StencilComponentNoShadow.jsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        const page = render({
            components: [AppProfile, NestedComponent],
            autoApplyChanges: true,
            template: () => (
                // @ts-ignore: types don't exist as we don't compile the components with Stencil
                <app-profile match={{ params: { name: 'stencil' } }}></app-profile>
            )
        })

        expect(page.container.tagName.toLowerCase()).toBe('stencil-stage')
        expect(page.root.tagName.toLowerCase()).toBe('app-profile')
        expect(typeof (await page.$container).elementId).toBe('string')
        expect(typeof (await page.$root).elementId).toBe('string')

        await expect($('>>>.app-profile')).toHaveText(
            expect.stringContaining('Hello! My name is Stencil.')
        )

        /**
         * this assertion for Safari due to: https://github.com/w3c/webdriver/issues/1786
         */
        if (browser.capabilities.browserName?.toLowerCase() !== 'safari') {
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

    it('can determine root if rendered somewhere nested', async () => {
        const page = render({
            components: [AppProfile, NestedComponent],
            template: () => (
                <div>
                    <div>
                        {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                        <app-profile match={{ params: { name: 'stencil' } }}></app-profile>
                    </div>
                </div>
            )
        })

        expect(page.root.tagName.toLowerCase()).toBe('app-profile')
        expect(page.root.parentElement?.parentElement?.parentElement?.tagName.toLowerCase()).toBe('stencil-stage')
    })

    it('can render via html', async () => {
        const page = render({
            components: [NestedComponent],
            html: '<nested-component></nested-component>'
        })

        await expect(page.$root.$('>>> i')).toHaveText('I am a unknown!')
    })

    it('can wait for changes', async () => {
        const page = render({
            components: [NoShadowComponent],
            html: '<no-shadow-component></no-shadow-component>'
        })

        expect(page.root.outerHTML).toBe('<no-shadow-component></no-shadow-component>')
        await waitForChanges()
        expect(page.root.outerHTML).toBe('<no-shadow-component>Hello World!</no-shadow-component>')
    })

    it('can unmount', async () => {
        const page = render({
            components: [NestedComponent],
            html: '<nested-component></nested-component>'
        })

        await expect(page.root).toBeExisting()
        page.unmount()
        await expect(page.root).not.toBeExisting()
    })
})
