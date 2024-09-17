import { browser } from '@wdio/globals'
import { Given } from '@wdio/cucumber-framework'

Given('test1', () => {
    browser.assertExecutingFeatureFileOnce('test1.feature')
})

Given('test2', () => {
    browser.assertExecutingFeatureFileOnce('test2.feature')
})

Given('test3', () => {
    browser.assertExecutingFeatureFileOnce('test3.feature')
})
