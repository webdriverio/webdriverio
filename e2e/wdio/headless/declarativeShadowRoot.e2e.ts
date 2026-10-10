import url from 'node:url'
import path from 'node:path'
import { browser, $, $$, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * A declarative shadow root (`<template shadowrootmode>`) is attached by the
 * HTML parser, not by `attachShadow()`: https://github.com/webdriverio/webdriverio/issues/14512
 */
describe('declarative shadow roots', () => {
    before(async () => {
        const resource = path.resolve(__dirname, '__fixtures__', 'declarativeShadowRoot.html')
        await browser.url(url.pathToFileURL(resource).href)
    })

    it('finds an element in a declarative shadow root', async () => {
        await expect($('#headlineInShadow')).toHaveText('Headline in Shadow Root')
        await expect($('#wrapper').$('#headlineInShadow')).toHaveText('Headline in Shadow Root')
    })

    it('finds an element in a declarative shadow root nested in another one', async () => {
        await expect($('#nested')).toHaveText('nested declarative shadow root')
        await expect($('#outer').$('#nested')).toHaveText('nested declarative shadow root')
    })

    it('finds an element in the declarative shadow root of a custom element', async () => {
        await expect($('#in-custom-element')).toHaveText('custom element')
    })

    it('counts elements in the document and in every open shadow root', async () => {
        await expect($$('span')).toBeElementsArrayOfSize(3)
        await expect($('#light')).toHaveText('light DOM')
    })

    it('does not pierce a closed declarative shadow root', async () => {
        await expect($('#in-closed')).not.toBeExisting()
        await expect($('#closed').shadow$('#in-closed')).toHaveText('closed declarative shadow root')
    })

    it('finds an element in a declarative shadow root that setHTMLUnsafe adds', async () => {
        await browser.execute(() => {
            const dynamic = document.getElementById('dynamic') as HTMLElement & { setHTMLUnsafe (html: string): void }
            dynamic.setHTMLUnsafe('<div id="added"><template shadowrootmode="open"><b id="in-added">added later</b></template></div>')
        })
        await expect($('#in-added')).toHaveText('added later')
        await expect($('#dynamic').$('#in-added')).toHaveText('added later')
    })
})
