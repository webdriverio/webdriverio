import '@angular/compiler'
import { TestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'
import { $, expect } from '@wdio/globals'

import { CounterComponent } from './counter.component'

describe('Angular counter', () => {
    before(() => {
        TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
    })

    afterEach(() => {
        TestBed.resetTestingModule()
    })

    after(() => {
        TestBed.resetTestEnvironment()
    })

    it('increments when clicked', async () => {
        const fixture = TestBed.createComponent(CounterComponent)
        await fixture.whenStable()

        const count = $('output[aria-label="Count"]')
        await expect(count).toHaveText('0')
        await $('button=Increment').click()
        await expect(count).toHaveText('1')
    })
})
