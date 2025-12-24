import { ELEMENT_KEY } from 'webdriver'
import type { CheerioAPI } from 'cheerio'
import { prettify as prettifyFn } from 'htmlfy'

import { getBrowserObject } from '@wdio/utils'
import { getShadowRootManager } from '../../session/shadowRoot.js'
import { getContextManager } from '../../session/context.js'
import getHTMLScript from '../../scripts/getHTML.js'
import getHTMLShadowScript from '../../scripts/getHTMLShadow.js'

const SHADOW_ID_ATTR_NAME = 'data-wdio-shadow-id'
const SHADOW_ID_ATTR = `[${SHADOW_ID_ATTR_NAME}]`

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
    :getHTMLShadow.js
    it('allows to snapshot shadow dom', async () => {
        await browser.url('https://ionicframework.com/docs/usage/v8/button/basic/demo.html?ionic:mode=md')

        // get snapshot of web component without its styles
        const snapshot = await $('ion-button').getHTML({ excludeElements: ['style'] })

        // assert snapshot
        await expect(snapshot).toMatchInlineSnapshot(`
            <ion-button class="md button button-solid ion-activatable ion-focusable hydrated">Default
                <template shadowrootmode="open">
                    <button type="button" class="button-native" part="native">
                    <span class="button-inner">
                        <slot name="icon-only"></slot>
                        <slot name="start"></slot>
                        <slot></slot>
                        <slot name="end"></slot>
                    </span>
                    <ion-ripple-effect role="presentation" class="md hydrated">
                        <template shadowrootmode="open"></template>
                    </ion-ripple-effect>
                    </button>
                </template>
            </ion-button>
        `)
    });
 * </example>
 *
 * @alias element.getHTML
 * @param {GetHTMLOptions} options                    command options
 * @param {boolean=}       options.includeSelectorTag if true it includes the selector element tag (default: `true`)
 * @param {boolean=}       options.pierceShadowRoot   if true it includes content of the shadow roots of all web components in the DOM (default: `true`)
 * @param {boolean=}       options.removeCommentNodes if true it removes all comment nodes from the HTML, e.g. `<!--?lit$206212805$--><!--?lit$206212805$-->` (default: `true`)
 * @param {boolean=}       options.prettify           if true, the html output will be prettified (default: `true`)
 * @return {Promise}  the HTML of the specified element (as a string)
 * @uses action/selectorExecute
 * @type property
 *
 */
export async function getHTML(
    this: WebdriverIO.Element,
    options: GetHTMLOptions = {}
): Promise<string> {
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

    const { includeSelectorTag, pierceShadowRoot, removeCommentNodes, prettify, excludeElements } = Object.assign({
        includeSelectorTag: true,
        pierceShadowRoot: true,
        removeCommentNodes: true,
        prettify: true,
        excludeElements: []
    }, options)

    const basicGetHTML = (elementId: string, includeSelectorTag: boolean) => {
        return browser.execute(getHTMLScript, {
            [ELEMENT_KEY]: elementId, // w3c compatible
            ELEMENT: elementId // jsonwp compatible
        } as unknown as HTMLElement, includeSelectorTag)
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
        const contextManager = getContextManager(browser)
        const context = await contextManager.getCurrentContext()
        const shadowRootElementPairs = shadowRootManager.getShadowElementPairsByContextId(context, (this as WebdriverIO.Element).elementId)

        /**
         * verify that shadow elements captured by the shadow root manager is still attached to the DOM
         */
        const elementsWithShadowRootAndIdVerified = ((
            await Promise.all(
                shadowRootElementPairs.map(([elemId, elem]) => (
                    browser.execute((elem) => elem.tagName, { [ELEMENT_KEY]: elemId } as unknown as HTMLElement).then(
                        () => [elemId, elem],
                        () => undefined
                    )
                ))
            )
        ).filter(Boolean) as [string, string | undefined][]).map(([elemId, shadowId]) => [
            elemId,
            { [ELEMENT_KEY]: elemId } as unknown as HTMLElement,
            shadowId ? { [ELEMENT_KEY]: shadowId } : undefined
        ]) as [string, HTMLElement, HTMLElement | undefined][]

        /**
         * then get the HTML of the element and its shadow roots
         */
        const { html, shadowElementHTML } = await this.execute(
            getHTMLShadowScript,
            includeSelectorTag,
            elementsWithShadowRootAndIdVerified
        )

        const $ = load(html)
        populateHTML($, shadowElementHTML.map(({ id, ...props }) => ({
            ...props,
            id,
            mode: shadowRootManager.getShadowRootModeById(context, id) || 'open'
        })))

        return sanitizeHTML($, { removeCommentNodes, prettify, excludeElements })
    }

    const returnHTML = await basicGetHTML(this.elementId, includeSelectorTag)
    return sanitizeHTML(returnHTML, { removeCommentNodes, prettify })
}

function populateHTML (
    $: CheerioAPI,
    shadowElementHTML: ({
        html: string
        id: string
        mode: ShadowRootMode
        styles?: string[];
    })[]
) {
    const shadowElements = $(SHADOW_ID_ATTR)
    if (shadowElements.length === 0) {
        return
    }
    for (const elem of shadowElements) {
        const id = elem.attribs[SHADOW_ID_ATTR_NAME]
        const shadowReference = shadowElementHTML.find(({ id: shadowRootId }) => id === shadowRootId)
        if (!shadowReference) {
            continue
        }

        $(`[${SHADOW_ID_ATTR_NAME}="${id}"]`).append([
            `<template shadowrootmode="${shadowReference.mode}">`,
            shadowReference.styles && shadowReference.styles.length > 0
                ? `\t<style>${shadowReference.styles.join('\n')}</style>`
                : '',
            `\t${shadowReference.html}`,
            '</template>',
        ].join('\n'))
        delete elem.attribs[SHADOW_ID_ATTR_NAME]
    }

    populateHTML($, shadowElementHTML)
}

/**
 * cleans up HTML based on command options
 * @param $       Cheerio object with our virtual DOM
 * @param options command options
 * @returns a string with the cleaned up HTML
 */
export function sanitizeHTML ($: CheerioAPI | string, options: GetHTMLOptions = {}): string {
    /**
     * delete data-wdio-shadow-id attribute as it contains random ids that
     * can cause failures when taking a snapshot of a Shadow DOM element
     */
    const isCheerioObject = $ && typeof $ !== 'string'

    /**
     * allow user to remove bloated or unwanted elements from the snapshot
     */
    if (isCheerioObject) {
        for (const elemToRemove of (options.excludeElements || [])) {
            $(elemToRemove).remove()
        }

        /**
         * Remove HTML comments using Cheerio's built-in functionality
         * This is more secure and reliable than regex-based removal
         */
        if (options.removeCommentNodes) {
            // Find all comment nodes and remove them
            $('*').contents().filter(function() {
                return this.type === 'comment'
            }).remove()
        }
    }

    let returnHTML = isCheerioObject ? $('body').html() as string : $

    /**
     * Fallback regex-based comment removal for string input
     * Only used when we don't have a Cheerio object
     */
    if (!isCheerioObject && options.removeCommentNodes && returnHTML) {
        // Use a simpler, safer regex that avoids catastrophic backtracking
        // This regex matches complete HTML comments only
        returnHTML = returnHTML.replace(/<!--[\s\S]*?-->/g, '')
    }

    return options.prettify
        ? prettifyFn(returnHTML)
        : returnHTML
}

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
    /**
     * remove certain elements from the output, e.g. style tags or svg elements
     * @default []
     */
    excludeElements?: string[]
}
