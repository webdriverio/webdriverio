// @ts-expect-error resolved by vite
import { expect, $ } from '@wdio/globals'
// import { screen } from '@testing-library/jest-dom'
// import userEvent from '@testing-library/user-event'
import { html, render } from 'lit'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

describe('isDisplayed', () => {
    beforeEach(async () => {
        // TODO: this fails with "Failed to load test page […]" error
        // while the browser actually appears able to load the page
        // await browser.url('http://localhost:8080/is-displayed.html')
        render(
            html`
                <style>
                    body {
                        background-color: white;
                    }

                    [id^="overflow"] {
                        width: 100px;
                        height: 100px;
                        background-color: black;
                    }
                </style>
                <main>
                    <h1>displayed elements</h1>
                    <h2><code>{ overflow: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow" style="overflow: hidden;">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow-x" style="overflow-x: hidden;">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow-y" style="overflow-y: hidden;">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 100; height: 0; }</code></h2>
                    <div id="overflow-x-0h" style="overflow-x: hidden; height: 0px;">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 0; height: 100; }</code></h2>
                    <div id="overflow-y-0w" style="overflow-y: hidden; width: 0px;">Some content</div>

                    <h1>not displayed elements</h1>
                    <h2><code>{ overflow: hidden; width: 0; height: 100; }</code></h2>
                    <div id="overflow-0w" style="overflow: hidden; width: 0px;">Some content</div>
                    <h2><code>{ overflow: hidden; width: 100; height: 0; }</code></h2>
                    <div id="overflow-0h" style="overflow: hidden; height: 0px;">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 0; height: 100 }</code></h2>
                    <div id="overflow-x-0w" style="overflow-x: hidden; width: 0px;">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 0; height: 0 }</code></h2>
                    <div id="overflow-y-0h" style="overflow-y: hidden; height: 0px;">Some content</div>
                </main>
            `,
            document.body
        )
    })

    describe('`overflow(-x/y): hidden` elements', () => {
        it('properly detects elements that are displayed', async () => {
            await expect($('#overflow')).toBeDisplayed()
            await expect($('#overflow-x')).toBeDisplayed()
            await expect($('#overflow-y')).toBeDisplayed()
            await expect($('#overflow-x-0h')).toBeDisplayed()
            await expect($('#overflow-y-0w')).toBeDisplayed()
        })

        it('properly detects elements that are not displayed', async () => {
            await expect($('#overflow-0w')).not.toBeDisplayed()
            await expect($('#overflow-0h')).not.toBeDisplayed()
            await expect($('#overflow-x-0w')).not.toBeDisplayed()
            await expect($('#overflow-y-0h')).not.toBeDisplayed()
        })
    })

})
