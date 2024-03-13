import { ELEMENT_KEY } from 'webdriver'
import type { CheerioAPI } from 'cheerio'

import { getBrowserObject } from '../../utils/index.js'
import { getShadowRootManager } from '../../shadowRoot.js'
import getHTMLScript from '../../scripts/getHTML.js'
import getHTMLShadowScript from '../../scripts/getHTMLShadow.js'

export interface GetHTMLOptions {
    /**
     * if true it includes the selector element tag (default: true)
     * @default true
     */
    includeSelectorTag?: boolean
    /**
     * if true it includes content of the shadow roots of all web
     * components in the DOM (default: true)
     * @default true
     */
    pierceShadowRoot?: boolean
}

/**
 *
 * Get source code of specified DOM element by selector.
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

        var innerHTML = await $('#test').getHTML(false);
        console.log(innerHTML);
        // outputs:
        // "<span>Lorem ipsum dolor amet</span>"
    });
 * </example>
 *
 * @alias element.getHTML
 * @param {}
 * @param {Boolean=} includeSelectorTag if true it includes the selector element tag (default: true)
 * @return {String}  the HTML of the specified element
 * @uses action/selectorExecute
 * @type property
 *
 */
export async function getHTML(
    this: WebdriverIO.Element,
    {
        includeSelectorTag = true,
        pierceShadowRoot = true
    }: GetHTMLOptions = {}
) {
    const browser = getBrowserObject(this)

    const basicGetHTML = (elementId: string, includeSelectorTag: boolean) => {
        return browser.execute(getHTMLScript, {
            [ELEMENT_KEY]: elementId, // w3c compatible
            ELEMENT: elementId // jsonwp compatible
        } as any as HTMLElement, includeSelectorTag)
    }

    if (pierceShadowRoot) {
        if (!this.isBidi) {
            throw new Error('Piercing shadow roots when calling `getHTML()` is only supported when using WebDriver Bidi')
        }

        /**
         * ensure command in Node.js world
         */
        if (globalThis.wdio) {
            return globalThis.wdio.executeWithScope('getHTML' as const, this.elementId, includeSelectorTag)
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

        /**
         * in case the given element has no elements containing a shadow root
         * we can return the HTML right away
         */
        if (shadowElementIdsFound.length === 0) {
            return html
        }

        const $ = load(html)
        await pierceIntoShadowDOM.call(browser, $, elemsWithShadowRootAndId, shadowElementIdsFound)

        /**
         * delete data-wdio-shadow-id attribute as it contains random ids that
         * can cause failures when taking a snapshot of a Shadow DOM element
         */
        $('shadow-root[id]').each((_, el) => { delete el.attribs.id })
        $('[data-wdio-shadow-id]').each((_, el) => { delete el.attribs['data-wdio-shadow-id'] })

        return $('body').html()
    }

    return basicGetHTML(this.elementId, includeSelectorTag)
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
        ).then(({ html, shadowElementIdsFound }) => (
            { html, shadowElementIdsFound, shadowRootId: sel }
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
        const { html } = shadowRootContent.find(({ shadowRootId }) => s === shadowRootId)!
        se.append(`<shadow-root id="${s}">${html}</shadow-root>`)
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
