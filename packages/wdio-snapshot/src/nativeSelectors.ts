import { toXPathStringLiteral } from '@wdio/utils'

import type { SnapshotCandidate } from './format.js'

// Node.js only: `selectors.ts` stays free of `@wdio/utils` because it is also loaded in the page

export interface SelectorNode {
    platform: 'android' | 'ios' | 'mac' | 'windows'
    tag: string
    name?: string
    text?: string
    resourceId?: string
    accessibilityId?: string
    className?: string
}

/** UiAutomator2's UiSelector parser unescapes only `\"`, so a backslash must stay literal. */
export function uiSelectorLiteral (value: string) {
    return `"${value.replace(/"/g, '\\"')}"`
}

/**
 * Native stable-selector candidates, best first (RFC §8.5).
 */
export function nativeCandidates (node: SelectorNode): SnapshotCandidate[] {
    const out: SnapshotCandidate[] = []
    if (node.accessibilityId) {
        out.push({ kind: 'accessibility-id', selector: `~${node.accessibilityId}` })
    }
    if (node.platform === 'android' && node.resourceId) {
        // UiAutomator2 prefixes a bare `id=` with the app package, so a package-less id (React Native testID) must match the raw attribute
        const selector = node.resourceId.includes(':id/')
            ? `id=${node.resourceId}`
            : `android=new UiSelector().resourceId(${uiSelectorLiteral(node.resourceId)})`
        out.push({ kind: 'resource-id', selector })
    }
    if ((node.platform === 'ios' || node.platform === 'mac') && node.name) {
        out.push({ kind: 'predicate', selector: `-ios predicate string:name == ${JSON.stringify(node.name)}` })
        out.push({ kind: 'class-chain', selector: `-ios class chain:**/${node.tag}[\`name == ${JSON.stringify(node.name)}\`]` })
    }
    if (node.platform === 'android' && node.text) {
        const klass = node.className || node.tag
        out.push({ kind: 'uiautomator', selector: `android=new UiSelector().text(${JSON.stringify(node.text)})` })
        out.push({ kind: 'xpath', selector: `//${klass}[@text=${toXPathStringLiteral(node.text)}]` })
    }
    if (node.platform === 'windows' && node.name) {
        out.push({ kind: 'xpath', selector: `//${node.tag}[@Name=${toXPathStringLiteral(node.name)}]` })
    }
    if (node.accessibilityId && node.platform === 'android') {
        const klass = node.className || node.tag
        out.push({ kind: 'xpath', selector: `//${klass}[@content-desc=${toXPathStringLiteral(node.accessibilityId)}]` })
    }
    if (!out.length) {
        out.push({ kind: 'tag', selector: `//${node.tag}` })
    }
    return out
}
