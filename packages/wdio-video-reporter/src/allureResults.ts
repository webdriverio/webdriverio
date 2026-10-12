import fs from 'node:fs'
import path from 'node:path'

interface AllureNode {
    attachments?: { source?: string }[]
    steps?: AllureNode[]
}

function removeFromNode (node: AllureNode, sources: Set<string>): boolean {
    let changed = false
    if (Array.isArray(node.attachments)) {
        const kept = node.attachments.filter((attachment) => !sources.has(attachment.source ?? ''))
        changed = kept.length !== node.attachments.length
        node.attachments = kept
    }
    for (const step of node.steps ?? []) {
        changed = removeFromNode(step, sources) || changed
    }
    return changed
}

/**
 * Remove placeholder attachment files and their attachment entries in the Allure
 * results (`*-result.json`), for example the video of a test that got no video
 */
export function removeAllureAttachments (allureOutputDir: string, placeholderFiles: string[]) {
    if (placeholderFiles.length === 0) {
        return
    }
    const sources = new Set(placeholderFiles.map((file) => path.basename(file)))
    for (const file of placeholderFiles) {
        fs.rmSync(file, { force: true })
    }
    for (const file of fs.readdirSync(allureOutputDir).filter((name) => name.endsWith('-result.json'))) {
        const resultPath = path.resolve(allureOutputDir, file)
        const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as AllureNode
        if (removeFromNode(result, sources)) {
            fs.writeFileSync(resultPath, JSON.stringify(result))
        }
    }
}
