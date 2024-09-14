import { browser } from '@wdio/globals'
import { Given } from '../../../packages/wdio-cucumber-framework/build/index.js'

Given('test1', () => {
    browser.assertExecutingFeatureFile('test1.feature')
})

Given('test2', () => {
    browser.assertExecutingFeatureFile('test2.feature')
})

Given('test3', () => {
    browser.assertExecutingFeatureFile('test3.feature')
})
