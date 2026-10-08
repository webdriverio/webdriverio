import type { SnapshotCandidate, SnapshotNode, SnapshotRef } from './format.js'
import { nativeCandidates, xpathLiteral, type SelectorNode } from './selectors.js'
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

const ANDROID_ROLES: Record<string, string> = {
    Button: 'button',
    ImageButton: 'button',
    ToggleButton: 'button',
    FloatingActionButton: 'button',
    MaterialButton: 'button',
    EditText: 'textbox',
    AutoCompleteTextView: 'textbox',
    MultiAutoCompleteTextView: 'textbox',
    SearchView: 'searchbox',
    ImageView: 'img',
    QuickContactBadge: 'img',
    CheckBox: 'checkbox',
    RadioButton: 'radio',
    Switch: 'switch',
    Spinner: 'combobox',
    SeekBar: 'slider',
    RatingBar: 'slider',
    ProgressBar: 'progressbar',
    TextView: 'text',
    CheckedTextView: 'text',
    RecyclerView: 'list',
    ListView: 'list',
    GridView: 'list',
    WebView: 'webview',
    ScrollView: 'scrollview'
}

const IOS_ROLES: Record<string, string> = {
    Button: 'button',
    Link: 'link',
    TextField: 'textbox',
    SecureTextField: 'textbox',
    TextView: 'textbox',
    SearchField: 'searchbox',
    Image: 'img',
    Icon: 'img',
    Switch: 'switch',
    Slider: 'slider',
    Stepper: 'slider',
    CheckBox: 'checkbox',
    RadioButton: 'radio',
    Picker: 'combobox',
    PickerWheel: 'combobox',
    DatePicker: 'combobox',
    SegmentedControl: 'combobox',
    StaticText: 'text',
    Cell: 'listitem',
    Table: 'list',
    CollectionView: 'list',
    NavigationBar: 'navigation',
    Alert: 'alertdialog',
    ScrollView: 'scrollview',
    Application: 'application',
    Window: 'window'
}

function androidRole (tag: string, attrs: Record<string, string>) {
    const role = ANDROID_ROLES[localName(tag)]
    if (role) {
        return role
    }
    return truthy(attrs.clickable) ? 'button' : 'group'
}

function iosRole (tag: string) {
    return IOS_ROLES[localName(tag).replace(/^XCUIElementType/, '')] || 'group'
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
    /** every selector key the node matches, whether or not it emits it */
    matches: string[]
    /**
     * selector for the n-th element sharing the node's best attribute, in
     * document order, used for a ref when none of its candidates is unique
     */
    fallback: string
}

interface Built {
    node: SnapshotNode
    refs: SnapshotRef[]
    located: Located[]
}

const STRUCTURAL = new Set(['hierarchy', 'AppiumAUT', '#root'])

function isStructural (xml: XmlNode) {
    return STRUCTURAL.has(xml.name) || STRUCTURAL.has(localName(xml.name))
}

/** attributes an indexed xpath filters on, best first */
const POSITIONAL_ATTRS: Record<'ios' | 'mac' | 'windows', string[]> = {
    ios: ['name', 'label', 'value'],
    mac: ['title', 'label', 'identifier'],
    windows: ['Name', 'AutomationId']
}

/**
 * How a node is indexed: `own` is the selector it emits, `at(n)` points at the
 * n-th (1-based) element that selector matches in document order, and `all`
 * lists every selector key the node itself matches, so counts include nodes
 * that prefer another attribute. Android prefers UiAutomator, whose
 * `.instance(n)` is 0-based; the rest use an xpath group, `(xpath)[n]`.
 */
function positionalOf (platform: NativePlatform, tag: string, attrs: Record<string, string>) {
    const bare = `//${tag}`
    if (platform === 'android') {
        const keyOf = (method: string, value: string) => `android=new UiSelector().${method}(${JSON.stringify(value)})`
        const matches = ([['description', attrs['content-desc']], ['resourceId', attrs['resource-id']], ['text', attrs.text]] as const)
            .filter(([, value]) => value)
            .map(([method, value]) => keyOf(method, value))
        const own = matches[0]
        const all = [bare, ...matches]
        if (own) {
            return { own, all, at: (n: number) => `${own}.instance(${n - 1})` }
        }
        return { own: bare, all, at: (n: number) => `(${bare})[${n}]` }
    }
    const names = POSITIONAL_ATTRS[platform]
    const keyOf = (attr: string) => `${bare}[@${attr}=${xpathLiteral(attrs[attr])}]`
    const present = names.filter((name) => attrs[name])
    const own = present.length ? keyOf(present[0]) : bare
    return { own, all: [bare, ...present.map(keyOf)], at: (n: number) => `(${own})[${n}]` }
}

function indexedSelectors (root: XmlNode, platform: NativePlatform) {
    const seen = new Map<string, number>()
    const out = new Map<XmlNode, { selector: string, matches: string[] }>()
    const visit = (xml: XmlNode) => {
        if (!isStructural(xml)) {
            const { own, all, at } = positionalOf(platform, selectorInfo(platform, xml.name, xml.attrs, '').tag, xml.attrs)
            out.set(xml, { selector: at((seen.get(own) || 0) + 1), matches: all })
            for (const key of new Set(all)) {
                seen.set(key, (seen.get(key) || 0) + 1)
            }
        }
        xml.children.forEach(visit)
    }
    visit(root)
    return out
}

interface BuildContext {
    platform: NativePlatform
    all?: boolean
    allocate: () => string
    indexed: Map<XmlNode, { selector: string, matches: string[] }>
}

function build (xml: XmlNode, ctx: BuildContext): Built | undefined {
    const { platform } = ctx
    if (isStructural(xml)) {
        const children = xml.children.map((child) => build(child, ctx)).filter((child): child is Built => Boolean(child))
        return {
            node: { role: 'document', children: children.map((child) => child.node) },
            refs: children.flatMap((child) => child.refs),
            located: children.flatMap((child) => child.located)
        }
    }
    const box = boundsOf(xml.attrs)
    const skip = hidden(xml.attrs, box)
    if (skip && !ctx.all) {
        return undefined
    }
    const role = roleOf(platform, xml.name, xml.attrs)
    const name = nameOf(platform, xml.name, xml.attrs)
    const children = xml.children.map((child) => build(child, ctx)).filter((child): child is Built => Boolean(child))
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
    const tagged = nativeCandidates(selectorInfo(platform, xml.name, xml.attrs, name))
    if (wantsRef(platform, xml.name, xml.attrs, role, name)) {
        const id = ctx.allocate()
        node.ref = id
        node.interactive = true
        refs.push({ id, role, name: name || undefined, candidates: tagged })
    }
    const position = ctx.indexed.get(xml)!
    located.push({ node, candidates: tagged.map((candidate) => candidate.selector), matches: position.matches, fallback: position.selector })
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
    const root = parseXml(xml)
    const built = build(root, { platform, all: opts.all, allocate: () => `e${++counter}`, indexed: indexedSelectors(root, platform) })
    const tree = built?.node || { role: 'document' }
    const located = built?.located || []
    const counts = new Map<string, number>()
    for (const { candidates, matches } of located) {
        for (const candidate of new Set([...candidates, ...matches])) {
            counts.set(candidate, (counts.get(candidate) || 0) + 1)
        }
    }
    const fallbacks = new Map(located.flatMap(({ node, fallback }) => node.ref ? [[node.ref, fallback] as const] : []))
    const refs = (built?.refs || []).map((ref) => {
        const unique = ref.candidates.filter((candidate) => counts.get(candidate.selector) === 1)
        const indexed: SnapshotCandidate = { kind: 'indexed', selector: fallbacks.get(ref.id)! }
        return { ...ref, candidates: unique.length ? unique : [indexed] }
    })
    return { tree, refs, located, counter }
}

function resourceIdOf (selector: string) {
    const plain = /^id=(.+)$/.exec(selector)
    if (plain) {
        return plain[1]
    }
    const ui = /resourceId\("([^"]*)"\)|resourceId\('([^']*)'\)/.exec(selector)
    return ui?.[1] ?? ui?.[2]
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
    const exact = located.filter((entry) => entry.candidates.includes(scope) || entry.fallback === scope)
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
