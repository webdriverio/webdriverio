import { expect, $ } from '@wdio/globals'
import { spyOn, mock } from '@wdio/browser-runner'
import { html, render } from 'lit'

import defaultExport, { namedExportValue } from 'someModule'

import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')
mock('./components/constants.ts', async (getOrigModule) => {
    const mod = await getOrigModule()
    return {
        GREETING: mod.GREETING + ' Sir'
    }
})

describe('Lit Component testing', () => {
    it('should render component', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! How are you today?')
    })

    it('should render with mocked component function', async () => {
        getQuestionFn.mockReturnValue('Does this work?')
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello Sir, WebdriverIO! Does this work?')
    })

    it('should allow to mock dependencies', () => {
        expect(defaultExport).toBe('barfoo')
        expect(namedExportValue).toBe('foobar')
    })
})
