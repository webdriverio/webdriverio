import fs from 'node:fs'
import path from 'node:path'

import { importOptionalDependency } from '@wdio/utils/node'

import { SessionError, usage } from '../errors.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

interface CompareResult {
    fileName?: string
    misMatchPercentage?: number
    folders?: { actual?: string, baseline?: string, diff?: string }
}

interface SaveOutput {
    path?: string
    fileName?: string
}

export interface VisualRecord {
    tag: string
    baseline?: string
    actual?: string
    diff?: string
    mismatch?: number
    fileName?: string
}

interface VisualFolders {
    baseline: string
    screenshots: string
}

type VisualBrowser = WebdriverIO.Browser & {
    saveScreen: (tag: string, opts?: object) => Promise<SaveOutput>
    saveElement: (el: WebdriverIO.Element, tag: string, opts?: object) => Promise<SaveOutput>
    saveFullPageScreen: (tag: string, opts?: object) => Promise<SaveOutput>
    saveTabbablePage: (tag: string, opts?: object) => Promise<SaveOutput>
    checkScreen: (tag: string, opts?: object) => Promise<CompareResult | number>
    checkElement: (el: WebdriverIO.Element, tag: string, opts?: object) => Promise<CompareResult | number>
    checkFullPageScreen: (tag: string, opts?: object) => Promise<CompareResult | number>
    checkTabbablePage: (tag: string, opts?: object) => Promise<CompareResult | number>
}

const saved = (text: string): ActionOutcome => ({ text })

export function visualVerdict (mismatch: number, threshold: number, diff?: string) {
    const line = `mismatch ${mismatch.toFixed(2)}% (threshold ${threshold}%)`
    if (mismatch > threshold) {
        throw new SessionError('VISUAL_MISMATCH', diff && fs.existsSync(diff) ? `${line}\n${diff}` : line)
    }
    return line
}

function asFolder (value: unknown, fallback: string) {
    if (typeof value === 'function') {
        const computed = value(undefined)
        if (typeof computed === 'string' && computed) {
            return computed
        }
    }
    return typeof value === 'string' && value ? value : fallback
}

function pngs (dir: string) {
    if (!fs.existsSync(dir)) {
        return new Set<string>()
    }
    return new Set(fs.readdirSync(dir).filter((name) => name.endsWith('.png')).map((name) => path.join(dir, name)))
}

function recordsOf (session: Session) {
    return session.get<VisualRecord[]>('visualRecords') || []
}

function remember (session: Session, record: VisualRecord) {
    const records = recordsOf(session).filter((item) => item.tag !== record.tag)
    records.push(record)
    session.set('visualRecords', records)
}

async function ensureVisual (session: Session) {
    if (session.get('visualReady')) {
        return session.get<VisualFolders>('visualFolders')!
    }
    const mod = await importOptionalDependency('@wdio/visual-service', {
        feature: 'compare screenshots',
        cwd: session.cwd,
        from: import.meta.url
    }) as { default: new (options: object, caps: object, config: object) => { remoteSetup: (browser: WebdriverIO.Browser) => Promise<void> } }
    const user = session.plan.visualOptions || {}
    const baseline = asFolder(user.baselineFolder, path.join(session.cwd, '.wdio', 'visual', 'baseline'))
    const screenshots = asFolder(user.screenshotPath, path.join(session.artifactsDir, 'visual'))
    const options = {
        autoSaveBaseline: true,
        formatImageName: '{tag}-{platformName}-{browserName}-{width}x{height}',
        disableCSSAnimation: true,
        disableBlinkingCursor: true,
        ...user,
        baselineFolder: baseline,
        screenshotPath: screenshots,
        compareOptions: {
            returnAllCompareData: true,
            ...(user.compareOptions && typeof user.compareOptions === 'object' ? user.compareOptions as object : {})
        }
    }
    const service = new mod.default(options, session.browser.capabilities, {})
    await service.remoteSetup(session.browser)
    const folders = { baseline, screenshots }
    session.set('visualReady', true)
    session.set('visualFolders', folders)
    return folders
}

/**
 * `save*` writes the image into the actual folder. A baseline is that file
 * copied into the baseline folder, which is what `check*` compares against.
 */
function baselineCopy (output: SaveOutput, baselineDir: string) {
    const actual = output.path && output.fileName
        ? path.join(output.path, output.fileName)
        : output.path || ''
    if (!actual || !fs.existsSync(actual) || !output.fileName) {
        return actual
    }
    const baseline = path.join(baselineDir, output.fileName)
    fs.mkdirSync(path.dirname(baseline), { recursive: true })
    fs.copyFileSync(actual, baseline)
    return baseline
}

function normalizeCompare (result: CompareResult | number): CompareResult {
    return typeof result === 'number' ? { misMatchPercentage: result } : result
}

async function runSave (browser: VisualBrowser, kind: 'screen' | 'element' | 'full' | 'tabbable', tag: string, element?: WebdriverIO.Element) {
    if (kind === 'element') {
        return browser.saveElement(element!, tag)
    }
    if (kind === 'full') {
        return browser.saveFullPageScreen(tag)
    }
    if (kind === 'tabbable') {
        return browser.saveTabbablePage(tag)
    }
    return browser.saveScreen(tag)
}

async function runCheck (browser: VisualBrowser, kind: 'screen' | 'element' | 'full' | 'tabbable', tag: string, element?: WebdriverIO.Element) {
    if (kind === 'element') {
        return browser.checkElement(element!, tag)
    }
    if (kind === 'full') {
        return browser.checkFullPageScreen(tag)
    }
    if (kind === 'tabbable') {
        return browser.checkTabbablePage(tag)
    }
    return browser.checkScreen(tag)
}

function kindOf (args: Record<string, unknown>) {
    const flags = [args.element ? 'element' : '', args.full ? 'full' : '', args.tabbable ? 'tabbable' : ''].filter(Boolean)
    if (flags.length > 1) {
        throw usage('Use only one of --element, --full or --tabbable.')
    }
    return (flags[0] || 'screen') as 'screen' | 'element' | 'full' | 'tabbable'
}

export const visual: ActionFn = async (session, args) => {
    const sub = String(args.sub || '')
    const tag = typeof args.tag === 'string' ? args.tag : ''
    if (!['save', 'check', 'accept', 'list'].includes(sub)) {
        throw usage('visual needs save, check, accept or list.')
    }
    if ((sub === 'save' || sub === 'check') && !tag) {
        throw usage('Give an image tag.', `Example: \`${session.cmd('visual', { sub: 'save', tag: 'home' }, 'wdio session visual save home')}\`.`)
    }
    if (sub === 'accept' && !tag && !args.all) {
        throw usage('Give a tag or pass --all.')
    }
    const folders = await ensureVisual(session)
    const browser = session.browser as VisualBrowser
    if (sub === 'list') {
        return listVisual(session, folders)
    }
    if (sub === 'accept') {
        return acceptVisual(session, folders, tag, Boolean(args.all))
    }
    const kind = kindOf(args)
    const element = kind === 'element' ? (await resolveTarget(session, args.element)).element : undefined
    if (sub === 'save') {
        const savedFile = await runSave(browser, kind, tag, element)
        const file = baselineCopy(savedFile, folders.baseline)
        remember(session, { tag, baseline: file || undefined, actual: savedFile.path && savedFile.fileName ? path.join(savedFile.path, savedFile.fileName) : undefined, fileName: savedFile.fileName })
        return saved(file ? `Saved ${file}` : `Saved ${tag}`)
    }
    const before = pngs(folders.baseline)
    const compared = normalizeCompare(await runCheck(browser, kind, tag, element))
    const created = [...pngs(folders.baseline)].filter((file) => !before.has(file))
    const diff = compared.folders?.diff
    remember(session, {
        tag,
        baseline: compared.folders?.baseline || created[0],
        actual: compared.folders?.actual,
        diff: diff && fs.existsSync(diff) ? diff : undefined,
        mismatch: compared.misMatchPercentage,
        fileName: compared.fileName
    })
    if (created.length) {
        return saved(`Baseline created\n${created[0]}`)
    }
    const threshold = typeof args.threshold === 'number' ? args.threshold : 0
    const mismatch = compared.misMatchPercentage ?? 0
    return saved(visualVerdict(mismatch, threshold, diff))
}

function listVisual (session: Session, folders: VisualFolders): ActionOutcome {
    const known = new Map(recordsOf(session).map((record) => [record.tag, record]))
    for (const file of pngs(folders.baseline)) {
        const match = [...known.values()].find((record) => record.baseline === file || record.fileName === path.basename(file))
        if (!match) {
            const tag = path.basename(file, '.png')
            known.set(tag, { tag, baseline: file })
        }
    }
    const tags = [...known.values()]
    const text = tags.length
        ? tags.map((record) => {
            const mismatch = record.mismatch === undefined ? '' : `  mismatch ${record.mismatch.toFixed(2)}%`
            const diff = record.diff ? `  ${record.diff}` : ''
            return `${record.tag}  ${record.baseline || ''}${mismatch}${diff}`.trimEnd()
        }).join('\n')
        : 'No visual baselines.'
    return { text, data: { tags } }
}

function acceptVisual (session: Session, folders: VisualFolders, tag: string, all: boolean): ActionOutcome {
    const actualDir = path.join(folders.screenshots, 'actual')
    if (!fs.existsSync(actualDir)) {
        throw usage('No actual images to accept.', `Run \`${session.cmd('visual', { sub: 'check' }, 'wdio session visual check')}\` first.`)
    }
    const files = fs.readdirSync(actualDir).filter((name) => name.endsWith('.png'))
    const records = recordsOf(session)
    const record = records.find((item) => item.tag === tag)
    const wanted = all
        ? files
        : files.filter((name) => record?.fileName === name)
    if (!wanted.length) {
        throw usage(`No actual image for "${tag}".`, `Run \`${session.cmd('visual', { sub: 'check' }, 'wdio session visual check')}\` first.`)
    }
    const copied: string[] = []
    for (const name of wanted) {
        const from = path.join(actualDir, name)
        const to = path.join(folders.baseline, name)
        fs.mkdirSync(path.dirname(to), { recursive: true })
        fs.copyFileSync(from, to)
        copied.push(to)
        const record = records.find((item) => item.fileName === name || item.tag === tag)
        if (record) {
            record.baseline = to
            record.mismatch = 0
            record.diff = undefined
        }
    }
    session.set('visualRecords', records)
    return saved(copied.map((file) => `Accepted ${file}`).join('\n'))
}
