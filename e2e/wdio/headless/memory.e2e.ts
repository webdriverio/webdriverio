/// <reference types="@wdio/lighthouse-service" />

// import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'

// import { imageSize } from 'image-size'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('main suite 1', () => {
    it('file', async () => {
        const resource = path.resolve(__dirname, '__fixtures__', 'test.html')
        await browser.url(url.pathToFileURL(resource).href)
        await expect($('h1')).toHaveText('Hello World')

        for (let index = 1; index < 15; index++) {
            browser.execute(async()=>{
                const sleep = (n:number)=>{
                    return new Promise((resolve)=>{
                        setTimeout(resolve, n*1000)
                    })
                }
                const number = document.querySelector('p')
                if (number){
                    const current = number.innerHTML
                    number.innerHTML = String(Number(current) + 1)
                    await sleep(3)
                }
            })
        }
    })
})
