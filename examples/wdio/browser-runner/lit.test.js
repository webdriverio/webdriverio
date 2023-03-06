import { expect, $ } from '@wdio/globals'
import { spyOn, mock, fn, unmock } from '@wdio/browser-runner'
import { html, render } from 'lit'
import isUrl from 'is-url'

import defaultExport, { namedExportValue } from 'someModule'
import namespacedModule from '@namespace/module'
import { someExport, namedExports } from '@testing-library/user-event'

import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')
mock('./components/constants.ts', async (getOrigModule) => {
    const mod = await getOrigModule()
    return {
        GREETING: mod.GREETING + ' Sir'
    }
})

mock('graphql-request', () => ({
    gql: fn(),
    GraphQLClient: class GraphQLClientMock {
        request = fn().mockResolvedValue({ result: 'Thanks for your answer!' })
    }
}))

mock('@testing-library/user-event', async (getOrigModule) => {
    const mod = await getOrigModule()
    return {
        someExport: 'foobarloo',
        namedExports: Object.keys(mod)
    }
})

unmock('is-url')
mock('@namespace/module')

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

    it('should allow to auto mock dependencies', () => {
        expect(defaultExport).toBe('barfoo')
        expect(namedExportValue).toBe('foobar')
        expect(namespacedModule).toBe('some value')
    })

    it('should allow to manual mock namespaces deps', async () => {
        expect(someExport).toBe('foobarloo')
        expect(namedExports).toEqual(['PointerEventsCheckLevel', 'default'])
    })

    it('should allow to unmock', () => {
        expect(isUrl).not.toBe('mocked value')
    })

    it('should have access to globals', () => {
        expect(process.env.WDIO_PRESET).toBe('lit')
        expect(window.WDIO_ENV_TEST).toBe('passed')
        expect(window.TEST_COMMAND).toBe('serve')
    })

    it('should allow to manual mock dependencies', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )
        await $('simple-greeting').$('>>> button').click()
        await expect($('simple-greeting').$('>>> em')).toHaveText('Thanks for your answer!')
    })
})
