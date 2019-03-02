import { Given } from 'cucumber'

Given('I go on the website {string}', (url) => {
    //return new Promise(function (resolve) {
    //    resolve(url)
    //})
    return url
})
