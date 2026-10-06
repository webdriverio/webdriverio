import type { SnapshotNode, SnapshotRef } from './format.js'
import { nativeCandidates, type SelectorNode } from './selectors.js'
import type { XmlNode } from './xml.js'
import { parseXml } from './xml.js'
import { SnapshotError } from './errors.js'
import { refId } from './refs.js'

export type NativePlatform = 'android' | 'ios' | 'mac' | 'windows'

const MAC_TYPES: Record<string, string> = {
    '2': 'XCUIElementTypeApplication',
    '7': 'XCUIElementTypeAlert',
    '9': 'XCUIElementTypeButton',
    '12': 'XCUIElementTypeCheckBox',
    '21': 'XCUIElementTypeNavigationBar',
    '26': 'XCUIElementTypeTable',
    '32': 'XCUIElementTypeCollectionView',
    '40': 'XCUIElementTypeSwitch',
    '42': 'XCUIElementTypeLink',
    '43': 'XCUIElementTypeImage',
    '46': 'XCUIElementTypeScrollView',
    '48': 'XCUIElementTypeStaticText',
    '49': 'XCUIElementTypeTextField',
    '50': 'XCUIElementTypeSecureTextField',
    '52': 'XCUIElementTypeTextView',
    '75': 'XCUIElementTypeCell'
}

const WINDOWS_ROLES: Record<string, string> = {
    Button: 'button',
    Edit: 'textbox',
    CheckBox: 'checkbox',
    RadioButton: 'radio',
    ComboBox: 'combobox',
    ListItem: 'listitem',
    MenuItem: 'menuitem',
    TabItem: 'tab',
    Hyperlink: 'link',
    Text: 'text',
    Window: 'window'
}

const WINDOWS_REFS = new Set(Object.keys(WINDOWS_ROLES))

function localName (name: string) {
    const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf(':'))
    const bare = slash === -1 ? name : name.slice(slash + 1)
    return bare.includes('.') ? bare.slice(bare.lastIndexOf('.') + 1) : bare
}

function truthy (value: string | undefined) {
    return value === 'true' || value === 'True' || value === '1'
}

function resourceSuffix (id: string) {
    const slash = id.lastIndexOf('/')
    if (slash !== -1) {
        return id.slice(slash + 1)
    }
    const colon = id.lastIndexOf(':id/')
    return colon === -1 ? id : id.slice(colon + 4)
}

export function nativePlatform (caps: Record<string, unknown>, target?: string): NativePlatform {
    const name = String(caps.platformName || target || '').toLowerCase()
    if (name === 'ios') {
        return 'ios'
    }
    if (name === 'mac' || name === 'macos') {
        return 'mac'
    }
    if (name === 'windows') {
        return 'windows'
    }
    return 'android'
}

function boundsOf (attrs: Record<string, string>): number[] | undefined {
    const box = attrs.bounds
    if (box) {
        const match = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(box)
        if (match) {
            const x1 = Number(match[1])
            const y1 = Number(match[2])
            const x2 = Number(match[3])
            const y2 = Number(match[4])
            return [x1, y1, x2 - x1, y2 - y1]
        }
    }
    if (attrs.x !== undefined && attrs.width !== undefined) {
        return [Number(attrs.x), Number(attrs.y || 0), Number(attrs.width), Number(attrs.height || 0)]
    }
    const rect = attrs.BoundingRectangle || attrs.boundingRectangle
    if (rect) {
        const parts = rect.split(/[,\s]+/).map(Number)
        if (parts.length >= 4 && parts.every((n) => Number.isFinite(n))) {
            return parts.slice(0, 4)
        }
    }
    return undefined
}

function hidden (attrs: Record<string, string>, box?: number[]) {
    if (attrs.displayed === 'false' || attrs.visible === 'false' || attrs.IsOffscreen === 'True' || attrs.IsOffscreen === 'true') {
        return true
    }
    if (box && (box[2] === 0 || box[3] === 0)) {
        return true
    }
    return false
}

function states (attrs: Record<string, string>) {
    const out: string[] = []
    if (truthy(attrs.checked) || truthy(attrs.Checked) || attrs.value === '1' && attrs.type?.includes('Switch')) {
        out.push('checked')
    }
    if (truthy(attrs.selected) || truthy(attrs.Selected)) {
        out.push('selected')
    }
    if (attrs.enabled === 'false' || attrs.Enabled === 'False' || attrs.IsEnabled === 'False' || attrs.IsEnabled === 'false') {
        out.push('disabled')
    }
    if (truthy(attrs.focused) || truthy(attrs.Focused)) {
        out.push('focused')
    }
    return out
}

function androidRole (tag: string, attrs: Record<string, string>) {
    const name = localName(tag)
    const roles: Record<string, string> = {
        Button: 'button',
        ImageButton: 'button',
        EditText: 'textbox',
        CheckBox: 'checkbox',
        Switch: 'switch',
        RadioButton: 'radio',
        TextView: 'text',
        ImageView: 'img',
        RecyclerView: 'list',
        ListView: 'list',
        ScrollView: 'scrollview'
    }
    if (roles[name]) {
        return roles[name]
    }
    if (truthy(attrs.clickable)) {
        return 'button'
    }
    return 'group'
}

function iosRole (tag: string) {
    const name = localName(tag).replace(/^XCUIElementType/, '')
    const roles: Record<string, string> = {
        Button: 'button',
        TextField: 'textbox',
        SecureTextField: 'textbox',
        TextView: 'textbox',
        Switch: 'switch',
        StaticText: 'text',
        Image: 'img',
        Cell: 'listitem',
        Table: 'list',
        CollectionView: 'list',
        NavigationBar: 'navigation',
        Alert: 'alertdialog',
        Link: 'link',
        ScrollView: 'scrollview',
        Application: 'application',
        Window: 'window'
    }
    return roles[name] || 'group'
}

function windowsRole (attrs: Record<string, string>, tag: string) {
    const control = attrs.ControlType || attrs.controlType || localName(tag)
    return WINDOWS_ROLES[control] || 'group'
}

function roleOf (platform: NativePlatform, tag: string, attrs: Record<string, string>) {
    if (platform === 'android') {
        return androidRole(tag, attrs)
    }
    if (platform === 'windows') {
        return windowsRole(attrs, tag)
    }
    const tagName = platform === 'mac' && attrs.elementType ? (MAC_TYPES[attrs.elementType] || tag) : tag
    return iosRole(tagName)
}

function nameOf (platform: NativePlatform, tag: string, attrs: Record<string, string>) {
    if (platform === 'android') {
        return attrs['content-desc'] || attrs.text || attrs.hint || (attrs['resource-id'] ? resourceSuffix(attrs['resource-id']) : '')
    }
    if (platform === 'windows') {
        return attrs.Name || attrs.AutomationId || ''
    }
    if (platform === 'mac') {
        return attrs.title || attrs.label || attrs.identifier || ''
    }
    return attrs.label || attrs.name || attrs.value || ''
}

function wantsRef (platform: NativePlatform, tag: string, attrs: Record<string, string>, role: string, name: string) {
    if (platform === 'android') {
        return truthy(attrs.clickable) || truthy(attrs.checkable) || (truthy(attrs.focusable) && role === 'textbox') || truthy(attrs['long-clickable'])
    }
    if (platform === 'windows') {
        const control = attrs.ControlType || attrs.controlType || localName(tag)
        return WINDOWS_REFS.has(control) && control !== 'Window' && control !== 'Text'
    }
    const raw = platform === 'mac' && attrs.elementType ? (MAC_TYPES[attrs.elementType] || tag) : tag
    const kind = localName(raw).replace(/^XCUIElementType/, '')
    if (['Button', 'TextField', 'SecureTextField', 'TextView', 'Switch', 'Cell', 'Link'].includes(kind)) {
        return true
    }
    return truthy(attrs.accessible) && Boolean(name)
}

function selectorInfo (platform: NativePlatform, tag: string, attrs: Record<string, string>, name: string): SelectorNode {
    const macTag = platform === 'mac' && attrs.elementType ? (MAC_TYPES[attrs.elementType] || tag) : tag
    return {
        platform,
        tag: platform === 'windows' ? (attrs.ControlType || localName(tag)) : macTag,
        name: name || undefined,
        text: attrs.text || undefined,
        resourceId: attrs['resource-id'] || undefined,
        accessibilityId: platform === 'android'
            ? (attrs['content-desc'] || undefined)
            : (attrs.name || attrs.label || attrs.identifier || attrs.AutomationId || undefined),
        className: tag
    }
}

export interface Located {
    node: SnapshotNode
    candidates: string[]
}

interface Built {
    node: SnapshotNode
    refs: SnapshotRef[]
    located: Located[]
}

function build (xml: XmlNode, platform: NativePlatform, opts: { all?: boolean }, allocate: (candidates: string[]) => string): Built | undefined {
    const structural = new Set(['hierarchy', 'AppiumAUT', '#root'])
    if (structural.has(xml.name) || structural.has(localName(xml.name))) {
        const children = xml.children.map((child) => build(child, platform, opts, allocate)).filter((child): child is Built => Boolean(child))
        return {
            node: { role: 'document', children: children.map((child) => child.node) },
            refs: children.flatMap((child) => child.refs),
            located: children.flatMap((child) => child.located)
        }
    }
    const box = boundsOf(xml.attrs)
    const skip = hidden(xml.attrs, box)
    if (skip && !opts.all) {
        return undefined
    }
    const role = roleOf(platform, xml.name, xml.attrs)
    const name = nameOf(platform, xml.name, xml.attrs)
    const children = xml.children.map((child) => build(child, platform, opts, allocate)).filter((child): child is Built => Boolean(child))
    const node: SnapshotNode = {
        role,
        ...(name ? { name } : {}),
        ...(states(xml.attrs).length ? { states: states(xml.attrs) } : {}),
        ...(box ? { box } : {}),
        ...(skip ? { hidden: true } : {}),
        ...(children.length ? { children: children.map((child) => child.node) } : {})
    }
    const refs = children.flatMap((child) => child.refs)
    const located = children.flatMap((child) => child.located)
    const candidates = nativeCandidates(selectorInfo(platform, xml.name, xml.attrs, name))
    if (wantsRef(platform, xml.name, xml.attrs, role, name)) {
        const id = allocate(candidates)
        node.ref = id
        node.interactive = true
        refs.push({ id, role, name: name || undefined, candidates })
    }
    located.push({ node, candidates })
    return { node, refs, located }
}

export interface ParsedNative {
    tree: SnapshotNode
    refs: SnapshotRef[]
    located: Located[]
    counter: number
}

export function parseNativeSource (xml: string, platform: NativePlatform, opts: { all?: boolean, counter?: number } = {}): ParsedNative {
    let counter = opts.counter || 0
    const built = build(parseXml(xml), platform, opts, () => `e${++counter}`)
    const tree = built?.node || { role: 'document' }
    return { tree, refs: built?.refs || [], located: built?.located || [], counter }
}

function resourceIdOf (selector: string) {
    const plain = /^id=(.+)$/.exec(selector)
    if (plain) {
        return plain[1]
    }
    const ui = /resourceId\((['"])(.*?)\1\)/.exec(selector)
    return ui?.[2]
}

/** `id=save` and `id=com.example:id/save` name the same Android resource. */
function sameResource (left: string, right: string) {
    const a = resourceIdOf(left)
    const b = resourceIdOf(right)
    if (!a || !b) {
        return false
    }
    return a === b || resourceSuffix(a) === resourceSuffix(b)
}

function matchingLocated (located: Located[], scope: string) {
    const exact = located.filter((entry) => entry.candidates.includes(scope))
    if (exact.length) {
        return exact
    }
    return located.filter((entry) => entry.candidates.some((candidate) => sameResource(candidate, scope)))
}

export function scopeNativeTree (tree: SnapshotNode, located: Located[], scope: string): SnapshotNode {
    const id = refId(scope)
    const hits = id
        ? located.filter((entry) => entry.node.ref === id)
        : matchingLocated(located, scope)
    if (hits.length !== 1) {
        throw new SnapshotError(
            'USAGE',
            hits.length > 1 ? `Scope ${scope} matches ${hits.length} elements.` : `Scope ${scope} is not in this snapshot.`,
            {
                hint: hits.length > 1
                    ? 'Pass a ref for a control, or a selector with text or a resource id for a container.'
                    : 'Run `wdio session snapshot` and pass a ref or a selector from that tree.'
            }
        )
    }
    return { role: 'document', name: tree.name, children: [hits[0].node] }
}
