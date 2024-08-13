interface EnhancedHTMLElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
}

interface CustomElementConstructor {
    new (...params: any[]): EnhancedHTMLElement;
}

export default function customElementWrapper () {
    const origFn = customElements.define.bind(customElements)
    customElements.define = function(name: string, Constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
        class WdioWrapperElement extends Constructor implements HTMLElement {
            disconnectedCallback() {
                super.disconnectedCallback && super.disconnectedCallback()
                console.debug('[WDIO]', 'removeShadowRoot', this)
            }
        }
        return origFn(name, WdioWrapperElement, options)
    }

    const attachShadowOrig = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (this: ShadowRoot, init: ShadowRootInit) {
        const shadowRoot = attachShadowOrig.call(this, init)
        let parentNode: ParentNode | null = shadowRoot.host

        /**
         * `parentNode.parentNode` might be `null` if the host element is not yet attached to the DOM
         */
        while (parentNode.parentNode) {
            parentNode = parentNode.parentNode
        }

        console.debug('[WDIO]', 'newShadowRoot', shadowRoot.host, parentNode, parentNode === document)
        return shadowRoot
    }
}
