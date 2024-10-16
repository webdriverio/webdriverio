import { browser } from '@wdio/globals'
import { Given } from '../../../packages/wdio-cucumber-framework/build/index.js'

Given('test1', () => {
    browser.assertExecutingFeatureFileOnce('test1.feature')
})

Given('test2', () => {
    browser.assertExecutingFeatureFileOnce('test2.feature')
})

Given('test3', () => {
    browser.assertExecutingFeatureFileOnce('test3.feature')
})
