import { ELEMENT_KEY } from 'webdriver'
import type { CheerioAPI } from 'cheerio'
import { prettify as prettifyFn } from 'htmlfy'

import { getBrowserObject } from '@wdio/utils'
import { getShadowRootManager } from '../../shadowRoot.js'
import getHTMLScript from '../../scripts/getHTML.js'
import getHTMLShadowScript from '../../scripts/getHTMLShadow.js'

export interface GetHTMLOptions {
    /**
     * if true, it includes the selector element tag (default: true)
     * @default true
     */
    includeSelectorTag?: boolean
    /**
     * if true, it includes content of the shadow roots of all web
     * components in the DOM (default: true if WebDriver Bidi is enabled)
     * @default true
     */
    pierceShadowRoot?: boolean
    /**
     * if true, it removes all comment nodes from the HTML, e.g. `<!--?lit$206212805$--><!--?lit$206212805$-->`
     * @default true
     */
    removeCommentNodes?: boolean
    /**
     * if true, the html output will be prettified
     * @default true
     */
    prettify?: boolean
}

/**
 *
 * Get source code of specified DOM element by selector. By default, it automatically
 * pierces through all shadow roots of elements contained by the element.
 *
 * <example>
    :index.html
    <div id="test">
        <span>Lorem ipsum dolor amet</span>
    </div>
    :getHTML.js
    it('should get html for certain elements', async () => {
        var outerHTML = await $('#test').getHTML();
        console.log(outerHTML);
        // outputs:
        // "<div id="test"><span>Lorem ipsum dolor amet</span></div>"

        var innerHTML = await $('#test').getHTML({ includeSelectorTag: false });
        console.log(innerHTML);
        // outputs:
        // "<span>Lorem ipsum dolor amet</span>"
    });
 * </example>
 *
 * @alias element.getHTML
 * @param {GetHTMLOptions} options                    command options
 * @param {Boolean=}       options.includeSelectorTag if true it includes the selector element tag (default: true)
 * @param {Boolean=}       options.pierceShadowRoot   if true it includes content of the shadow roots of all web components in the DOM
 * @param {Boolean=}       options.removeCommentNodes if true it removes all comment nodes from the HTML, e.g. `<!--?lit$206212805$--><!--?lit$206212805$-->`
 * @param {Boolean=}       options.prettify           if true, the html output will be prettified
 * @return {String}  the HTML of the specified element
 * @uses action/selectorExecute
 * @type property
 *
 */
export async function getHTML(
    this: WebdriverIO.Element,
    options: GetHTMLOptions = {}
) {
    const browser = getBrowserObject(this)

    /**
     * `getHTML` options used to be a string that was the `includeSelectorTag` option
     * and we need to ensure backwards compatibility
     */
    if (typeof options !== 'object' && typeof options === 'boolean') {
        options = { includeSelectorTag: options }
    } else if (typeof options !== 'object') {
        throw new Error('The `getHTML` options parameter must be an object')
    }

    const { includeSelectorTag, pierceShadowRoot, removeCommentNodes, prettify } = Object.assign({
        includeSelectorTag: true,
        pierceShadowRoot: true,
        removeCommentNodes: true,
        prettify: true
    }, options)

    const basicGetHTML = (elementId: string, includeSelectorTag: boolean) => {
        return browser.execute(getHTMLScript, {
            [ELEMENT_KEY]: elementId, // w3c compatible
            ELEMENT: elementId // jsonwp compatible
        } as any as HTMLElement, includeSelectorTag)
    }

    if (pierceShadowRoot && this.isBidi) {
        /**
         * ensure command in Node.js world
         */
        if (globalThis.wdio) {
            return globalThis.wdio.executeWithScope(
                'getHTML' as const, this.elementId,
                { includeSelectorTag, pierceShadowRoot, removeCommentNodes, prettify }
            )
        }

        const { load } = await import('cheerio')
        const shadowRootManager = getShadowRootManager(browser)
        const handle = await browser.getWindowHandle()
        const shadowRoots = shadowRootManager.getShadowRootsForContext(handle)

        /**
         * first get all shadow roots and their elements as ElementReference
         */
        const elemsWithShadowRootAndId = shadowRoots.map((shadowRootId) => [
            shadowRootId,
            { [ELEMENT_KEY]: shadowRootManager.getElementWithShadowDOM(shadowRootId) }
        ]) as unknown as [string, HTMLElement][]

        /**
         * then get the HTML of the element and its shadow roots
         */
        const { html, shadowElementIdsFound } = await browser.execute(
            getHTMLShadowScript,
            { [ELEMENT_KEY]: this.elementId } as any as HTMLElement,
            includeSelectorTag,
            elemsWithShadowRootAndId
        )

        const $ = load(html)

        /**
         * in case the given element has no elements containing a shadow root
         * we can return the HTML right away
         */
        if (shadowElementIdsFound.length === 0) {
            return sanitizeHTML($, { removeCommentNodes, prettify })
        }

        await pierceIntoShadowDOM.call(browser, $, elemsWithShadowRootAndId, shadowElementIdsFound)
        return sanitizeHTML($, { removeCommentNodes, prettify })
    }

    const returnHTML = await basicGetHTML(this.elementId, includeSelectorTag)
    return sanitizeHTML(returnHTML, { removeCommentNodes, prettify })
}

/**
 * Recursively pierce into shadow DOMs
 * @param browser WebdriverIO browser object
 * @param $ Cheerio object with our virtual DOM we are trying to build up with shadow DOM content
 * @param elemsWithShadowRootAndId list of all shadow root ids and their elements as ElementReference
 * @param shadowElementIdsFound list of shadow root ids we want to look up in the next iteration
 */
async function pierceIntoShadowDOM (
    this: WebdriverIO.Browser,
    $: CheerioAPI,
    elemsWithShadowRootAndId: [string, HTMLElement][],
    shadowElementIdsFound: string[]
): Promise<void> {
    /**
     * fetch html of shadow roots
     */
    const shadowRootContent = await Promise.all(shadowElementIdsFound.map((sel) => (
        this.execute(
            getHTMLShadowScript,
            { [ELEMENT_KEY]: sel } as any as HTMLElement,
            false,
            elemsWithShadowRootAndId
        ).then(({ html, shadowElementIdsFound, styles }) => (
            { html, styles, shadowElementIdsFound, shadowRootId: sel }
        ))
    )))

    /**
     * update virtual DOM and inject shadow root content
     */
    for (const s of shadowElementIdsFound) {
        const se = $(`[data-wdio-shadow-id="${s}"]`)
        if (!se) {
            continue
        }
        const { html, styles } = shadowRootContent.find(({ shadowRootId }) => s === shadowRootId)!
        se.append([
            `<template shadowroot="open" shadowrootmode="open" id="${s}">`,
            styles.length > 0
                ? `\t<style>${styles.join('\n')}</style>`
                : '',
            `\t${html}`,
            '</template>',
        ].join('\n'))
    }

    const elementsToLookup = shadowRootContent.map(({ shadowElementIdsFound }) => shadowElementIdsFound).flat()

    /**
     * stop recursion if no more shadow roots to look up
     */
    if (elementsToLookup.length === 0) {
        return
    }

    return pierceIntoShadowDOM.call(this, $, elemsWithShadowRootAndId, elementsToLookup)
}

/**
 * cleans up HTML based on command options
 * @param $       Cheerio object with our virtual DOM
 * @param options command options
 * @returns a string with the cleaned up HTML
 */
function sanitizeHTML ($: CheerioAPI | string, options: GetHTMLOptions = {}): string {
    /**
     * delete data-wdio-shadow-id attribute as it contains random ids that
     * can cause failures when taking a snapshot of a Shadow DOM element
     */
    const isCheerioObject = $ && typeof $ !== 'string'
    if (isCheerioObject) {
        $('template[id]').each((_, el) => { delete el.attribs.id })
        $('[data-wdio-shadow-id]').each((_, el) => { delete el.attribs['data-wdio-shadow-id'] })
    }

    let returnHTML = isCheerioObject ? $('body').html() as string : $
    if (options.removeCommentNodes) {
        returnHTML = returnHTML?.replace(/<!--[\s\S]*?-->/g, '')
    }
    return options.prettify
        ? prettifyFn(returnHTML)
        : returnHTML
}
