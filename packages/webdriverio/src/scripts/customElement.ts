interface EnhancedHTMLElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
}

interface CustomElementConstructor {
    new (...params: unknown[]): EnhancedHTMLElement;
}

export default function customElementWrapper () {
    const origFn = customElements.define.bind(customElements)
    customElements.define = function(name: string, Constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
        const origConnectedCallback = Constructor.prototype.connectedCallback
        Constructor.prototype.connectedCallback = function(this: HTMLElement) {
            let parentNode: ParentNode | null = this
            while (parentNode.parentNode) {
                parentNode = parentNode.parentNode
            }
            console.debug('[WDIO]', 'newShadowRoot', this, parentNode, parentNode === document, document.documentElement)
            return origConnectedCallback?.call(this)
        }

        const origDisconnectedCallback = Constructor.prototype.disconnectedCallback
        Constructor.prototype.disconnectedCallback = function(this: HTMLElement) {
            console.debug('[WDIO]', 'removeShadowRoot', this)
            return origDisconnectedCallback?.call(this)
        }
        return origFn(name, Constructor, options)
    }

    const origAttachShadow = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (this: HTMLElement, init: ShadowRootInit) {
        const shadowRoot = origAttachShadow.call(this, init)
        let parentNode: ParentNode | null = this
        while (parentNode.parentNode) {
            parentNode = parentNode.parentNode
        }
        console.debug('[WDIO]', 'newShadowRoot', this, parentNode, parentNode === document, document.documentElement)
        return shadowRoot
    }
}
