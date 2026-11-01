import { Given } from '@wdio/cucumber-framework'

Given('a step that rejects a promise without await', function () {
    Promise.reject(new Error('late rejection'))
})
