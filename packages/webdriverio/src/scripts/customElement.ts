interface EnhancedHTMLElement extends HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
}

interface CustomElementConstructor {
    new (...params: unknown[]): EnhancedHTMLElement;
}

type HTMLUnsafeTarget = (Element | ShadowRoot) & { setHTMLUnsafe?: (...args: unknown[]) => void }

export default function customElementWrapper () {
    /**
     * Hosts that were reported with a shadow root while connected. The walks
     * below skip them, so a host is not sent twice for the same document.
     */
    const reportedHosts = new WeakSet<Element>()

    const sendShadowRoot = (host: Element, hasShadowRoot: boolean) => {
        let parentNode: ParentNode | null = host
        while (parentNode.parentNode) {
            parentNode = parentNode.parentNode
        }
        if (hasShadowRoot && host.isConnected) {
            reportedHosts.add(host)
        }
        console.debug('[WDIO]', 'newShadowRoot', host, parentNode, parentNode === document, document.documentElement)
    }

    /**
     * The Node.js side adds a host under the shadow root it is in and drops
     * it when that root is unknown. Report the open hosts that contain `host`
     * first, outermost first: a custom element can attach its shadow root in
     * its constructor, inside a declarative shadow root that is only walked
     * on `DOMContentLoaded`.
     */
    const reportShadowRoot = (host: Element, hasShadowRoot: boolean) => {
        if (host.isConnected) {
            const containingHosts: Element[] = []
            for (let root = host.getRootNode(); root instanceof ShadowRoot; root = root.host.getRootNode()) {
                containingHosts.unshift(root.host)
            }
            for (const containingHost of containingHosts) {
                if (containingHost.shadowRoot && !reportedHosts.has(containingHost)) {
                    sendShadowRoot(containingHost, true)
                }
            }
        }
        sendShadowRoot(host, hasShadowRoot)
    }

    /**
     * Report the open shadow roots under `root`, parents before the roots
     * nested in them. This finds the roots that no hook below sees: a
     * declarative shadow root (`<template shadowrootmode>`) is attached by the
     * HTML parser or by `setHTMLUnsafe()`, not by `attachShadow()`.
     */
    const reportShadowRootsIn = (root: Document | Element | ShadowRoot) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
        for (let node = walker.nextNode() as Element | null; node; node = walker.nextNode() as Element | null) {
            const shadowRoot = node.shadowRoot
            if (!shadowRoot) {
                continue
            }
            if (!reportedHosts.has(node)) {
                reportShadowRoot(node, true)
            }
            reportShadowRootsIn(shadowRoot)
        }
    }

    const origFn = customElements.define.bind(customElements)
    customElements.define = function(name: string, Constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
        const origConnectedCallback = Constructor.prototype.connectedCallback
        Constructor.prototype.connectedCallback = function(this: HTMLElement) {
            reportShadowRoot(this, Boolean(this.shadowRoot))
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
        reportShadowRoot(this, true)
        return shadowRoot
    }

    for (const proto of [Element.prototype, ShadowRoot.prototype] as HTMLUnsafeTarget[]) {
        const origSetHTMLUnsafe = proto.setHTMLUnsafe
        if (typeof origSetHTMLUnsafe !== 'function') {
            continue
        }
        proto.setHTMLUnsafe = function (this: HTMLUnsafeTarget, ...args: unknown[]) {
            const result = origSetHTMLUnsafe.apply(this, args)
            if (this.isConnected) {
                reportShadowRootsIn(this)
            }
            return result
        }
    }

    /**
     * the parser has attached every declarative shadow root of the document
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => reportShadowRootsIn(document), { once: true })
    } else {
        reportShadowRootsIn(document)
    }
}
