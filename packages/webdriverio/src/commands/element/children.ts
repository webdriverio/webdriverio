import { $$ } from '../browser/$$.js'
import type { Selector } from '../../types.js'

export interface ChildrenOptions {
    withinShadowRoot?: boolean
}

/**
 * Returns the direct child elements of this element in DOM order. Text and comment
 * nodes, and more deeply nested descendants, are not included.
 *
 * By default, this returns light DOM children, even when the element has a shadow
 * root. Set `withinShadowRoot` to return the direct children of its open shadow root
 * instead. The result is empty if there is no accessible open shadow root.
 *
 * The result is a [`WebdriverIO.ElementArray`](/docs/api/browser/$$), with the same
 * indexing and asynchronous iteration methods as `$$`.
 *
 * <example>
    :children.js
    const children = await $('#parent').children()
    for (const child of children) {
        console.log(await child.getTagName())
    }
    const firstShadowChild = $('#component').children({ withinShadowRoot: true })[0]
    console.log(await firstShadowChild.getText())
 * </example>
 *
 * @alias element.children
 * @param {ChildrenOptions=} options                  command options
 * @param {Boolean=} options.withinShadowRoot         query the open shadow root instead of the light DOM (default: false)
 * @return {WebdriverIO.ElementArray}
 * @type utility
 */
export function children (
    this: WebdriverIO.Element,
    { withinShadowRoot = false }: ChildrenOptions = {}
): WebdriverIO.ElementArray {
    const selector = withinShadowRoot
        ? function shadowChildren (this: HTMLElement) {
            return Array.from(this.shadowRoot?.children ?? [])
        }
        : function children (this: HTMLElement) {
            return Array.from(this.children)
        }
    // Function selectors can return multiple DOM elements through the $$ query path.
    return $$.call(this, selector as unknown as Selector)
}
