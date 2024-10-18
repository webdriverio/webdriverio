import { $, $$, browser, expect } from '@wdio/globals'
import { render, waitForChanges } from '@wdio/browser-runner/stencil'

import { AppProfile } from './components/StencilComponent.jsx'
import { NestedComponent } from './components/StencilComponentNested.jsx'
import { NoShadowComponent } from './components/StencilComponentNoShadow.jsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        /**
         * only run snapshot tests in non-Safari browsers as shadow dom piercing
         * is not yet supported in Safari
         */
        if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
            return
        }

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

        await expect($('.app-profile')).toHaveText(
            expect.stringContaining('Hello! My name is Stencil.')
        )

        /**
         * this assertion for Safari due to: https://github.com/w3c/webdriver/issues/1786
         */
        if ((browser.capabilities as WebdriverIO.Capabilities).browserName?.toLowerCase() !== 'safari') {
            await expect($('.app-profile')).toHaveText(
                expect.stringContaining('I am a nested component!')
            )
        }

        await expect($('.app-profile').getCSSProperty('font-weight'))
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
        /**
         * only run snapshot tests in non-Safari browsers as shadow dom piercing
         * is not yet supported in Safari
         */
        if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
            return
        }

        const page = render({
            components: [NestedComponent],
            html: '<nested-component></nested-component>'
        })

        await expect(page.$root.$('i')).toHaveText('I am a unknown!')
    })

    it('can wait for changes', async () => {
        const page = render({
            components: [NoShadowComponent],
            html: '<no-shadow-component></no-shadow-component>'
        })

        expect(page.root.outerHTML).toBe('<no-shadow-component></no-shadow-component>')
        await waitForChanges()
        expect(page.root.outerHTML).toBe('<no-shadow-component class="hydrated">Hello World!</no-shadow-component>')
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

    /**
     * Started to fail due to "stale element exception" due to the fact that the element
     * was looked up in a different frame
     */
    it.skip('can auto peirce shadow dom', async () => {
        if (browser.capabilities.browserName?.toLowerCase() === 'safari') {
            return
        }
        render({
            components: [AppProfile, NestedComponent],
            template: () => (
                <div>
                    {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                    <nested-component id="first transparent component"></nested-component>
                    <div className="nested">
                        {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                        <nested-component id="transparent component in a nested context"></nested-component>
                    </div>
                    <div className="nested second">
                        {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                        <nested-component id="transparent component in a second nested context"></nested-component>
                        {/* @ts-ignore: types don't exist as we don't compile the components with Stencil */}
                        <app-profile match={{ params: { name: 'stencil' } }}></app-profile>
                    </div>
                </div>
            )
        })

        await expect($('i')).toHaveText('I am a first transparent component!')
        await expect($('.nested i')).not.toBeExisting()

        /**
         * is able to find element within multiple nested levels of shadow dom
         * .second > app-profile#shadow-root > nested-component#shadow-root > i
         */
        await expect($('.second').$('app-profile').$('i'))
            .toHaveText('I am a nested component!')
        /**
         * finds first <i/> in the first nested component element
         */
        await expect($('.nested').$('i'))
            .toHaveText('I am a transparent component in a nested context!')

        /**
         * can combine different selector strategies
         */
        await expect($('.nested').$('=I am a link')).toBePresent()
        await expect($('.nested').$('*=a link')).toBePresent()

        expect(await $$('i').map((el) => el.getText())).toEqual([
            'I am a first transparent component!',
            'I am a transparent component in a nested context!',
            'I am a transparent component in a second nested context!',
            'I am a nested component!'
        ])
        expect(await $('.nested').$$('i').map((el) => el.getText())).toEqual([
            'I am a transparent component in a nested context!',
        ])
        expect(await $('.second').$$('i').map((el) => el.getText())).toEqual([
            'I am a transparent component in a second nested context!',
            'I am a nested component!'
        ])
        await expect($('nested-component').$$('i')).toBeElementsArrayOfSize(1)
        await expect($('nested-component').$$('i')).not.toBeElementsArrayOfSize(42)

        await expect($('nested-component')).toMatchSnapshot()
        await expect($('.nested')).toMatchSnapshot()
        await expect($('.second')).toMatchSnapshot()

        const allI = await $$('i')
        await expect(allI).toBeElementsArrayOfSize(4)
    })
})
