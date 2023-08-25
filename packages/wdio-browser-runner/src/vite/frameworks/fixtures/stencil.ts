import { h } from '@stencil/core'

process.nextTick = (cb) => setTimeout(cb, 0)

// @ts-expect-error
window.React = {
    createElement: h,
}

import type {
    ComponentRuntimeMeta,
    ComponentTestingConstructor,
    HostRef,
    LazyBundlesRuntimeData,
    NewSpecPageOptions,
} from '@stencil/core/internal'
import {
    bootstrapLazy,
    flushAll,
    insertVdomAnnotations,
    registerComponents,
    registerModule,
    renderVdom,
    setSupportsShadowDom,
    startAutoApplyChanges,
    styles,
    win,
    writeTask,
    // @ts-expect-error
} from '@stencil/core/internal/testing/index.js'

interface StencilEnvironment {
    /**
     * After changes have been made to a component, such as a update to a property or
     * attribute, the test page does not automatically apply the changes. In order to
     * wait for, and apply the update, call await `flushAll()`.
     */
    flushAll: () => void
}

/**
 * Creates a new spec page for unit testing
 * @param opts the options to apply to the spec page that influence its configuration and operation
 * @returns the created spec page
 */
export function render(opts: NewSpecPageOptions): StencilEnvironment {
    if (!opts) {
        throw new Error('NewSpecPageOptions required')
    }

    const stencilStage = document.querySelector('stencil-stage')
    if (stencilStage) {
        stencilStage.remove()
    }
    const stage = document.createElement('stencil-stage')
    document.body.appendChild(stage)

    if (Array.isArray(opts.components)) {
        registerComponents(opts.components)
    }

    if (opts.hydrateClientSide) {
        opts.includeAnnotations = true
    }
    if (opts.hydrateServerSide) {
        opts.includeAnnotations = true
        setSupportsShadowDom(false)
    } else {
        opts.includeAnnotations = !!opts.includeAnnotations
        if (opts.supportsShadowDom === false) {
            setSupportsShadowDom(false)
        } else {
            setSupportsShadowDom(true)
        }
    }
    const cmpTags = new Set<string>()
    const doc = win.document

    const page = {
        win: win,
        doc: doc,
        body: stage as any,
        styles: styles as Map<string, string>
    } as const

    const lazyBundles: LazyBundlesRuntimeData = opts.components.map((Cstr: ComponentTestingConstructor) => {
        // eslint-disable-next-line eqeqeq
        if (Cstr.COMPILER_META == null) {
            throw new Error('Invalid component class: Missing static "COMPILER_META" property.')
        }

        cmpTags.add(Cstr.COMPILER_META.tagName)
        Cstr.isProxied = false

        proxyComponentLifeCycles(Cstr)

        const bundleId = `${Cstr.COMPILER_META.tagName}.${Math.round(Math.random() * 899999) + 100000}`
        const stylesMeta = Cstr.COMPILER_META.styles
        if (Array.isArray(stylesMeta)) {
            if (stylesMeta.length > 1) {
                const styles: any = {}
                stylesMeta.forEach((style) => {
                    styles[style.modeName] = style.styleStr
                })
                Cstr.style = styles
            } else if (stylesMeta.length === 1) {
                Cstr.style = stylesMeta[0].styleStr
            }
        }
        registerModule(bundleId, Cstr)

        const lazyBundleRuntimeMeta = formatLazyBundleRuntimeMeta(bundleId, [Cstr.COMPILER_META])
        return lazyBundleRuntimeMeta
    })

    if (typeof opts.direction === 'string') {
        page.doc.documentElement.setAttribute('dir', opts.direction)
    }

    if (typeof opts.language === 'string') {
        page.doc.documentElement.setAttribute('lang', opts.language)
    }

    bootstrapLazy(lazyBundles)

    if (typeof opts.template === 'function') {
        const cmpMeta: ComponentRuntimeMeta = {
            $flags$: 0,
            $tagName$: 'body',
        }
        const ref: HostRef = {
            $ancestorComponent$: undefined,
            $flags$: 0,
            $modeName$: undefined,
            $cmpMeta$: cmpMeta,
            $hostElement$: page.body,
        }
        renderVdom(ref, opts.template())
    }

    let rootComponent: any = null
    Object.defineProperty(page, 'root', {
        get() {
            if (!rootComponent) {
                rootComponent = findRootComponent(cmpTags, page.body)
            }
            if (rootComponent) {
                return rootComponent
            }
            const firstElementChild = page.body.firstElementChild
            if (!firstElementChild) {
                return firstElementChild as any
            }
            return null
        },
    })

    if (opts.hydrateServerSide) {
        insertVdomAnnotations(doc, [])
    }

    if (opts.autoApplyChanges) {
        startAutoApplyChanges()
    }

    flushAll()
    return { flushAll }
}

/**
 * A helper method that proxies Stencil lifecycle methods by mutating the provided component class
 * @param Cstr the component class whose lifecycle methods will be proxied
 */
function proxyComponentLifeCycles(Cstr: ComponentTestingConstructor): void {
    // we may have called this function on the class before, reset the state of the class
    if (typeof Cstr.prototype?.__componentWillLoad === 'function') {
        Cstr.prototype.componentWillLoad = Cstr.prototype.__componentWillLoad
        Cstr.prototype.__componentWillLoad = null
    }
    if (typeof Cstr.prototype?.__componentWillUpdate === 'function') {
        Cstr.prototype.componentWillUpdate = Cstr.prototype.__componentWillUpdate
        Cstr.prototype.__componentWillUpdate = null
    }
    if (typeof Cstr.prototype?.__componentWillRender === 'function') {
        Cstr.prototype.componentWillRender = Cstr.prototype.__componentWillRender
        Cstr.prototype.__componentWillRender = null
    }

    // the class should be in a known 'good' state to proxy functions
    if (typeof Cstr.prototype?.componentWillLoad === 'function') {
        Cstr.prototype.__componentWillLoad = Cstr.prototype.componentWillLoad
        Cstr.prototype.componentWillLoad = function () {
            // @ts-expect-error
            const result = this.__componentWillLoad()
            if (result && typeof result.then === 'function') {
                writeTask(() => result)
            } else {
                writeTask(() => Promise.resolve())
            }
            return result
        }
    }

    if (typeof Cstr.prototype?.componentWillUpdate === 'function') {
        Cstr.prototype.__componentWillUpdate = Cstr.prototype.componentWillUpdate
        Cstr.prototype.componentWillUpdate = function () {
            // @ts-expect-error
            const result = this.__componentWillUpdate()
            if (result && typeof result.then === 'function') {
                writeTask(() => result)
            } else {
                writeTask(() => Promise.resolve())
            }
            return result
        }
    }

    if (typeof Cstr.prototype?.componentWillRender === 'function') {
        Cstr.prototype.__componentWillRender = Cstr.prototype.componentWillRender
        Cstr.prototype.componentWillRender = function () {
            // @ts-expect-error
            const result = this.__componentWillRender()
            if (result && typeof result.then === 'function') {
                writeTask(() => result)
            } else {
                writeTask(() => Promise.resolve())
            }
            return result
        }
    }
}

/**
 * Return the first Element whose {@link Element#nodeName} property matches a tag found in the provided `cmpTags`
 * argument.
 *
 * If the `nodeName` property on the element matches any of the names found in the provided `cmpTags` argument, that
 * element is returned. If no match is found on the current element, the children will be inspected in a depth-first
 * search manner. This process continues until either:
 * - an element is found (and execution ends)
 * - no element is found after an exhaustive search
 *
 * @param cmpTags component tag names to use in the match criteria
 * @param node the node whose children are to be inspected
 * @returns An element whose name matches one of the strings in the provided `cmpTags`. If no match is found, `null` is
 * returned
 */
function findRootComponent(cmpTags: Set<string>, node: Element): Element | null {
    if (node) {
        const children = node.children
        const childrenLength = children.length

        for (let i = 0; i < childrenLength; i++) {
            const elm = children[i]
            if (cmpTags.has(elm.nodeName.toLowerCase())) {
                return elm
            }
        }

        for (let i = 0; i < childrenLength; i++) {
            const r = findRootComponent(cmpTags, children[i])
            if (r) {
                return r
            }
        }
    }
    return null
}

/**
 * A set of flags used for bitwise calculations against {@link ComponentRuntimeMeta#$flags$}.
 *
 * These flags should only be used in conjunction with {@link ComponentRuntimeMeta#$flags$}.
 * They should _not_ be used for calculations against other fields/numbers
 */
export const enum CMP_FLAGS {
    /**
     * Used to determine if a component is using the shadow DOM.
     * e.g. `shadow: true | {}` is set on the `@Component()` decorator
     */
    shadowDomEncapsulation = 1 << 0,
    /**
     * Used to determine if a component is using scoped stylesheets
     * e.g. `scoped: true` is set on the `@Component()` decorator
     */
    scopedCssEncapsulation = 1 << 1,
    /**
     * Used to determine if a component does not use the shadow DOM _and_ has `<slot/>` tags in its markup.
     */
    hasSlotRelocation = 1 << 2,
    // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
    // Note that when we remove this field we should consider whether we need to
    // retain a placeholder here, since if we want to have compatability between
    // different versions of the runtime then we'll need to not shift the values
    // of the other higher flags down
    /**
     * Determines if a shim for the shadow DOM is necessary.
     *
     * The shim should only be needed if a component requires {@link shadowDomEncapsulation} and if any output
     * target-specific criteria are met. Refer to this flag's usage to determine each output target's criteria.
     */
    needsShadowDomShim = 1 << 3,
    /**
     * Determines if `delegatesFocus` is enabled for a component that uses the shadow DOM.
     * e.g. `shadow: { delegatesFocus: true }` is set on the `@Component()` decorator
     */
    shadowDelegatesFocus = 1 << 4,
    /**
     * Determines if `mode` is set on the `@Component()` decorator
     */
    hasMode = 1 << 5,
    // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
    /**
     * Determines if styles must be scoped due to either:
     * 1. A component is using scoped stylesheets ({@link scopedCssEncapsulation})
     * 2. A component is using the shadow DOM _and_ the output target's rules for requiring a shadow DOM shim have been
     * met ({@link needsShadowDomShim})
     */
    needsScopedEncapsulation = scopedCssEncapsulation | needsShadowDomShim,
}

const formatLazyBundleRuntimeMeta = (
    bundleId: any,
    cmps: any[],
): any => {
    return [bundleId, cmps.map((cmp) => formatComponentRuntimeMeta(cmp, true))]
}

/**
 * Transform metadata about a component from the compiler to a compact form for
 * use at runtime.
 *
 * @param compilerMeta component metadata gathered during compilation
 * @param includeMethods include methods in the component's members or not
 * @returns a compact format for component metadata, intended for runtime use
 */
export const formatComponentRuntimeMeta = (
    compilerMeta: any,
    includeMethods: boolean,
): any => {
    let flags = 0
    if (compilerMeta.encapsulation === 'shadow') {
        flags |= CMP_FLAGS.shadowDomEncapsulation
        if (compilerMeta.shadowDelegatesFocus) {
            flags |= CMP_FLAGS.shadowDelegatesFocus
        }
    } else if (compilerMeta.encapsulation === 'scoped') {
        flags |= CMP_FLAGS.scopedCssEncapsulation
    }
    if (compilerMeta.encapsulation !== 'shadow' && compilerMeta.htmlTagNames.includes('slot')) {
        flags |= CMP_FLAGS.hasSlotRelocation
    }
    if (compilerMeta.hasMode) {
        flags |= CMP_FLAGS.hasMode
    }

    const members = formatComponentRuntimeMembers(compilerMeta, includeMethods)
    const hostListeners = formatHostListeners(compilerMeta)
    return trimFalsy([
        flags,
        compilerMeta.tagName,
        Object.keys(members).length > 0 ? members : undefined,
        hostListeners.length > 0 ? hostListeners : undefined,
    ])
}

const formatComponentRuntimeMembers = (
    compilerMeta: any,
    includeMethods = true,
): any => {
    return {
        ...formatPropertiesRuntimeMember(compilerMeta.properties),
        ...formatStatesRuntimeMember(compilerMeta.states),
        ...(includeMethods ? formatMethodsRuntimeMember(compilerMeta.methods) : {}),
    }
}

const formatPropertiesRuntimeMember = (properties: any[]) => {
    const runtimeMembers: any = {}

    properties.forEach((member) => {
        runtimeMembers[member.name] = trimFalsy([
            /**
             * [0] member type
             */
            formatFlags(member),
            formatAttrName(member),
        ])
    })
    return runtimeMembers
}

const formatFlags = (compilerProperty: any) => {
    let type = formatPropType(compilerProperty.type)
    if (compilerProperty.mutable) {
        type |= MEMBER_FLAGS.Mutable
    }
    if (compilerProperty.reflect) {
        type |= MEMBER_FLAGS.ReflectAttr
    }
    return type
}

const formatAttrName = (compilerProperty: any) => {
    if (typeof compilerProperty.attribute === 'string') {
        // string attr name means we should observe this attribute
        if (compilerProperty.name === compilerProperty.attribute) {
            // property name and attribute name are the exact same
            // true value means to use the property name for the attribute name
            return undefined
        }

        // property name and attribute name are not the same
        // so we need to return the actual string value
        // example: "multiWord" !== "multi-word"
        return compilerProperty.attribute
    }

    // we shouldn't even observe an attribute for this property
    return undefined
}
const enum MEMBER_FLAGS {
    String = 1 << 0,
    Number = 1 << 1,
    Boolean = 1 << 2,
    Any = 1 << 3,
    Unknown = 1 << 4,

    State = 1 << 5,
    Method = 1 << 6,
    Event = 1 << 7,
    Element = 1 << 8,

    ReflectAttr = 1 << 9,
    Mutable = 1 << 10,

    Prop = String | Number | Boolean | Any | Unknown,
    HasAttribute = String | Number | Boolean | Any,
    PropLike = Prop | State,
}

const formatPropType = (type: any) => {
    if (type === 'string') {
        return MEMBER_FLAGS.String
    }
    if (type === 'number') {
        return MEMBER_FLAGS.Number
    }
    if (type === 'boolean') {
        return MEMBER_FLAGS.Boolean
    }
    if (type === 'any') {
        return MEMBER_FLAGS.Any
    }
    return MEMBER_FLAGS.Unknown
}

const formatStatesRuntimeMember = (states: any[]) => {
    const runtimeMembers: any = {}

    states.forEach((member) => {
        runtimeMembers[member.name] = [
            /**
             * [0] member flags
             */
            MEMBER_FLAGS.State,
        ]
    })
    return runtimeMembers
}

const formatMethodsRuntimeMember = (methods: any[]) => {
    const runtimeMembers: any = {}

    methods.forEach((member) => {
        runtimeMembers[member.name] = [
            /**
             * [0] member flags
             */
            MEMBER_FLAGS.Method,
        ]
    })
    return runtimeMembers
}

const formatHostListeners = (compilerMeta: any) => {
    return compilerMeta.listeners.map((compilerListener: any) => {
        const hostListener: any = [
            computeListenerFlags(compilerListener),
            compilerListener.name,
            compilerListener.method,
        ]
        return hostListener
    })
}

const enum LISTENER_FLAGS {
    Passive = 1 << 0,
    Capture = 1 << 1,

    TargetDocument = 1 << 2,
    TargetWindow = 1 << 3,
    TargetBody = 1 << 4,

    /**
     * @deprecated Prevented from new apps, but left in for older collections
     */
    TargetParent = 1 << 5,
}

const computeListenerFlags = (listener: any) => {
    let flags = 0
    if (listener.capture) {
        flags |= LISTENER_FLAGS.Capture
    }
    if (listener.passive) {
        flags |= LISTENER_FLAGS.Passive
    }
    switch (listener.target) {
    case 'document':
        flags |= LISTENER_FLAGS.TargetDocument
        break
    case 'window':
        flags |= LISTENER_FLAGS.TargetWindow
        break
    case 'body':
        flags |= LISTENER_FLAGS.TargetBody
        break
    case 'parent' as any:
        flags |= LISTENER_FLAGS.TargetParent
        break
    }
    return flags
}

const trimFalsy = (data: any): any => {
    const arr = data as any[]
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]) {
            break
        }
        // if falsy, safe to pop()
        arr.pop()
    }

    return arr
}
