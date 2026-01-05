import type { remote } from 'webdriver'

interface EnhancedHTMLElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
}

interface CustomElementConstructor {
    new (...params: unknown[]): EnhancedHTMLElement;
}

export interface NewShadowRootEvent {
    type: 'newShadowRoot'
    shadowElement: remote.ScriptNodeRemoteValue
    rootElement: remote.ScriptNodeRemoteValue
    isDocument: boolean
    documentElement: remote.ScriptNodeRemoteValue
    window: { context: string }
}

export interface RemoveShadowRootEvent {
    type: 'removeShadowRoot'
    window: { context: string }
    element: remote.ScriptNodeRemoteValue
}

export type CustomElementEvent = NewShadowRootEvent | RemoveShadowRootEvent

export default function customElementWrapper (emit: (data: CustomElementEvent) => void) {
    const origFn = customElements.define.bind(customElements)
    customElements.define = function(name: string, Constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
        const origConnectedCallback = Constructor.prototype.connectedCallback
        Constructor.prototype.connectedCallback = function(this: HTMLElement) {
            let parentNode: ParentNode | null = this
            while (parentNode.parentNode) {
                parentNode = parentNode.parentNode
            }

            /**
             * The WebDriver Bidi protocol transforms the values into a reference,
             * hence we have to cast them to the correct type.
             */
            emit({
                type: 'newShadowRoot',
                shadowElement: this as unknown as remote.ScriptNodeRemoteValue,
                rootElement: parentNode as unknown as remote.ScriptNodeRemoteValue,
                isDocument: parentNode === document,
                documentElement: document.documentElement as unknown as remote.ScriptNodeRemoteValue,
                window: globalThis.window as unknown as { context: string }
            })
            return origConnectedCallback?.call(this)
        }

        const origDisconnectedCallback = Constructor.prototype.disconnectedCallback
        Constructor.prototype.disconnectedCallback = function(this: HTMLElement) {
            /**
             * The WebDriver Bidi protocol transforms the values into a reference,
             * hence we have to cast them to the correct type.
             */
            emit({
                type: 'removeShadowRoot',
                element: this as unknown as remote.ScriptNodeRemoteValue,
                window: globalThis.window as unknown as { context: string }
            })
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

        /**
         * The WebDriver Bidi protocol transforms the values into a reference,
         * hence we have to cast them to the correct type.
         */
        emit({
            type: 'newShadowRoot',
            shadowElement: this as unknown as remote.ScriptNodeRemoteValue,
            rootElement: parentNode as unknown as remote.ScriptNodeRemoteValue,
            isDocument: parentNode === document,
            documentElement: document.documentElement as unknown as remote.ScriptNodeRemoteValue,
            window: globalThis.window as unknown as { context: string }
        })
        return shadowRoot
    }
}
