// @ts-expect-error resolved by vite
import { expect, $ } from '@wdio/globals'
// import { screen } from '@testing-library/jest-dom'
// import userEvent from '@testing-library/user-event'
import { html, render } from 'lit'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

describe('isDisplayed', () => {
    beforeEach(async () => {
        render(
            html`
                <style>
                    body {
                        background-color: white;
                    }

                    .black-square {
                        width: 100px;
                        height: 100px;
                        background-color: black;
                    }
                </style>
                <main>
                    <h1>children of elements with visibility: hidden for which isDisplayed should be true</h1>
                    <h2><code>.parent { visibility: hidden; .children { visibility: visible; } }</code></h2>
                    <div style="visibility: hidden;"><div id="visibility-visible" style="visibility: visible;" class="black-square">Some content</div></div>

                    <h1>children of elements with visibility: hidden for which isDisplayed should be false</h1>
                    <h2><code>.parent { visibility: hidden; .children {  } }</code></h2>
                    <div style="visibility: hidden;"><div id="visibility-hidden" style=" " class="black-square">Some content</div></div>

                    <h1>children of elements with opacity: 0 for which isDisplayed should be false</h1>
                    <h2><code>.parent { opacity: 0; .children { opacity: 1; } }</code></h2>
                    <div style="opacity: 0;"><div id="opacity-0" style="opacity: 1;" class="black-square">Some content</div></div>

                    <h1>children of elements with display: none for which isDisplayed should be false</h1>
                    <h2><code>.parent { display: none; .children { display: block; } }</code></h2>
                    <div style="display: none;"><div id="display-none" style="display: block;" class="black-square">Some content</div></div>

                    <h1>elements with overflow: hidden for which isDisplayed should be true</h1>
                    <h2><code>{ overflow: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow" style="overflow: hidden;" class="black-square">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow-x" style="overflow-x: hidden;" class="black-square">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 100; height: 100; }</code></h2>
                    <div id="overflow-y" style="overflow-y: hidden;" class="black-square">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 100; height: 0; }</code></h2>
                    <div id="overflow-x-0h" style="overflow-x: hidden; height: 0px;" class="black-square">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 0; height: 100; }</code></h2>
                    <div id="overflow-y-0w" style="overflow-y: hidden; width: 0px;" class="black-square">Some content</div>

                    <h1>elements with overflow: hidden for which isDisplayed should be false</h1>
                    <h2><code>{ overflow: hidden; width: 0; height: 100; }</code></h2>
                    <div id="overflow-0w" style="overflow: hidden; width: 0px;" class="black-square">Some content</div>
                    <h2><code>{ overflow: hidden; width: 100; height: 0; }</code></h2>
                    <div id="overflow-0h" style="overflow: hidden; height: 0px;" class="black-square">Some content</div>
                    <h2><code>{ overflow-x: hidden; width: 0; height: 100 }</code></h2>
                    <div id="overflow-x-0w" style="overflow-x: hidden; width: 0px;" class="black-square">Some content</div>
                    <h2><code>{ overflow-y: hidden; width: 0; height: 0 }</code></h2>
                    <div id="overflow-y-0h" style="overflow-y: hidden; height: 0px;" class="black-square">Some content</div>
                </main>
            `,
            document.body
        )
    })

    describe('`visibility: hidden` elements', () => {
        it('properly detects elements that are displayed', async () => {
            await expect($('#visibility-visible')).toBeDisplayed()
        })

        it('properly detects elements that are not displayed', async () => {
            await expect($('#visibility-hidden')).not.toBeDisplayed()
        })
    })

    describe('`opacity: 0` elements', () => {
        it('properly detects elements that are displayed', async () => {
            await expect($('#opacity-0')).not.toBeDisplayed()
        })
    })

    describe('`display: none` elements', () => {
        it('properly detects elements that are displayed', async () => {
            await expect($('#display-none')).not.toBeDisplayed()
        })
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
