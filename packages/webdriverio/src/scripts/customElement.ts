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
            connectedCallback() {
                super.connectedCallback && super.connectedCallback()
                let parentNode: ParentNode | null = this
                while (parentNode.parentNode) {
                    parentNode = parentNode.parentNode
                }
                console.debug('[WDIO]', 'newShadowRoot', this, parentNode)
            }
            disconnectedCallback() {
                super.disconnectedCallback && super.disconnectedCallback()
                console.debug('[WDIO]', 'removeShadowRoot', this)
            }
        }
        return origFn(name, WdioWrapperElement, options)
    }
}
