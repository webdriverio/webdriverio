import type { ArgumentsCamelCase, Argv } from 'yargs'
import { attach } from 'webdriverio'

import { readSession, getSessionDir, getRefsPath, buildAttachOptions } from '../session.js'
import { writeRefs, type RefMap } from '../refs.js'
import { getBrowserInteractableElements } from '../snapshot/browser.js'
import { getBrowserAccessibilityTree } from '../snapshot/browser-a11y.js'
import { getMobileVisibleElements } from '../snapshot/mobile.js'
import {
    formatBrowserElement,
    formatMobileElement,
    formatAccessibilityNode,
} from '../format.js'

export const command = 'snapshot'
export const desc = 'Capture interactive elements on the page'

export const builder = (yargs: Argv) => {
    return yargs
        .option('visible', {
            type: 'boolean',
            default: true,
            describe: 'Only show elements in viewport',
        })
        .option('a11y', {
            type: 'boolean',
            default: false,
            describe: 'Show accessibility tree instead of interactive elements (browser only)',
        })
}

interface SnapshotArgs {
    session: string
    visible: boolean
    a11y: boolean
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<SnapshotArgs>) {
    const sessionName = argv.session as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const meta = await readSession(sessionName, sessionsDir)
    if (!meta) {
        console.error(`Error: No active session "${sessionName}". Run wdiox open <url> first.`)
        return
    }

    const browser = await attach(buildAttachOptions(meta))

    const isMobile = browser.isAndroid || browser.isIOS
    const refs: RefMap = {}

    if (argv.a11y && !isMobile) {
        // Accessibility tree mode (browser only)
        const nodes = await getBrowserAccessibilityTree(browser)
        const currentUrl = await browser.getUrl()
        console.log(`\n Page: ${currentUrl}\n`)

        nodes.forEach((node, i) => {
            const ref = `a${i + 1}`
            console.log(formatAccessibilityNode(ref, node))
            refs[ref] = {
                tagName: node.role,
                text: node.name,
                role: node.role,
                name: node.name,
            }
        })

        console.log(`\n ${nodes.length} nodes - ${sessionName} session - accessibility tree\n`)
    } else if (isMobile) {
        // Mobile snapshot
        const platform = browser.isIOS ? 'ios' : 'android'
        const elements = await getMobileVisibleElements(browser, platform)
        const filtered = argv.visible
            ? elements.filter(el => el.isInViewport)
            : elements

        const appName = (meta.capabilities['appium:app'] as string) || 'unknown'
        console.log(`\n App: ${appName}\n`)

        filtered.forEach((el, i) => {
            const ref = `e${i + 1}`
            console.log(formatMobileElement(ref, {
                tagName: el.tagName,
                text: el.text,
                selector: el.selector,
                accessibilityId: el.accessibilityId,
                resourceId: el.resourceId,
            }))
            refs[ref] = {
                selector: el.selector,
                tagName: el.tagName,
                text: el.text,
            }
        })

        console.log(`\n ${filtered.length} elements - ${sessionName} session\n`)
    } else {
        // Browser snapshot
        const elements = await getBrowserInteractableElements(browser)
        const filtered = argv.visible
            ? elements.filter(el => el.isInViewport)
            : elements

        const currentUrl = await browser.getUrl()
        console.log(`\n Page: ${currentUrl}\n`)

        filtered.forEach((el, i) => {
            const ref = `e${i + 1}`
            console.log(formatBrowserElement(ref, el))
            refs[ref] = {
                cssSelector: el.cssSelector,
                tagName: el.tagName,
                text: el.textContent || '',
                placeholder: el.placeholder || '',
            }
        })

        console.log(`\n ${filtered.length} elements - ${sessionName} session\n`)
    }

    await writeRefs(getRefsPath(sessionName, sessionsDir), refs)
}
