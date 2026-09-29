import fs from 'node:fs'
import path from 'node:path'

import { usage } from '../errors.js'
import { generateSpec } from '../export/spec.js'
import type { ActionFn } from '../session.js'

export const history: ActionFn = async (session, args) => {
    if (args.clear) {
        session.history.clear()
        return { text: 'History cleared.', data: { entries: [] } }
    }
    return {
        text: session.history.format(),
        data: { entries: session.history.entries }
    }
}

export const exportSpec: ActionFn = async (session, args) => {
    const entries = session.history.entries
    if (!entries.length) {
        throw usage('No steps recorded.', 'Drive the session first, then run `wdio session export`.')
    }
    const title = typeof args.title === 'string' && args.title ? args.title : session.name
    const framework = args.framework === 'jasmine' ? 'jasmine' : 'mocha'
    const cwd = String(args.$cwd || session.cwd)
    const out = path.resolve(cwd, typeof args.out === 'string' && args.out
        ? args.out
        : session.artifact('export', `${session.name}.e2e.ts`))
    const files = generateSpec(entries, {
        title,
        pageObjects: Boolean(args.pageObjects),
        baseUrl: session.plan.remote.baseUrl,
        cwd,
        outDir: path.dirname(out)
    })
    const written: string[] = []
    for (const file of files) {
        const target = file.path === 'spec.ts' ? out : path.join(path.dirname(out), file.path)
        if (file.path !== 'spec.ts' && fs.existsSync(target)) {
            throw usage(`Page object ${target} already exists.`, 'Choose another --out directory, or remove that file first.')
        }
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, file.contents)
        written.push(target)
    }
    return {
        text: written.map((file) => `Wrote ${file}`).join('\n'),
        data: { files: written, framework },
        files: written
    }
}
