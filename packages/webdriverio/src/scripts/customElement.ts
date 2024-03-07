interface EnhancedHTMLElement extends HTMLElement {
    connectedCallback?(): void;
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
                console.debug('[WDIO]', 'newShadowRoot', this.shadowRoot)
            }
        }
        return origFn(name, WdioWrapperElement, options)
    }
}
