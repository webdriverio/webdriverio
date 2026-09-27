import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { usage } from './errors.js'
import type { ActionResult } from './types.js'

/**
 * `src/` is not published, but it is present in this repo and in a git
 * checkout. Walk up from the bundled file to the package that owns the skill.
 */
export function readSkillMarkdown (start = path.dirname(fileURLToPath(import.meta.url))) {
    let dir = start
    for (let i = 0; i < 8; i++) {
        const pkgFile = path.join(dir, 'package.json')
        if (fs.existsSync(pkgFile)) {
            try {
                const name = JSON.parse(fs.readFileSync(pkgFile, 'utf-8')).name
                const skill = path.join(dir, 'src', 'skill', 'SKILL.md')
                if (name === '@wdio/session' && fs.existsSync(skill)) {
                    return fs.readFileSync(skill, 'utf-8')
                }
            } catch {
                // keep walking
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    throw new Error('Cannot find @wdio/session src/skill/SKILL.md')
}

export async function skill (args: Record<string, unknown>, _ctx?: unknown): Promise<ActionResult> {
    const markdown = readSkillMarkdown()
    if (typeof args.install === 'string' && args.install) {
        if (args.install.includes('\0')) {
            throw usage('Invalid --install path.')
        }
        const root = path.resolve(args.install)
        const dest = root.endsWith(`${path.sep}SKILL.md`) || root.endsWith('SKILL.md') ? root : path.join(root, '.agents', 'skills', 'wdio-session', 'SKILL.md')
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.writeFileSync(dest, markdown)
        return { text: dest, data: { path: dest } }
    }
    return { text: markdown.replace(/\n$/, ''), data: { markdown } }
}
