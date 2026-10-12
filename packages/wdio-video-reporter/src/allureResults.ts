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
    if (Array.isArray(node.steps)) {
        node.steps = node.steps.filter((step) => {
            if (!removeFromNode(step, sources)) {
                return true
            }
            changed = true
            /**
             * `addAttachment` puts the video in a step of its own: drop the step
             * when nothing is left in it
             */
            return Boolean(step.attachments?.length || step.steps?.length)
        })
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
        let result: AllureNode
        try {
            result = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as AllureNode
        } catch {
            /**
             * another worker can write this file at the same time: it is not one of ours
             */
            continue
        }
        if (removeFromNode(result, sources)) {
            /**
             * a rename replaces the file at once, so another worker never reads half of it
             */
            const tempPath = `${resultPath}.${process.pid}.tmp`
            fs.writeFileSync(tempPath, JSON.stringify(result))
            fs.renameSync(tempPath, resultPath)
        }
    }
}
