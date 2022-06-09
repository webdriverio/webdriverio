import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import markdox from 'markdox'
import { promisify } from 'node:util'

import formatter from '../utils/formatter.js'
import compiler from '../utils/compiler.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'api.tpl.ejs')
const MARKDOX_OPTIONS = {
    formatter: formatter,
    compiler: compiler,
    template: TEMPLATE_PATH
}

const processDocs = promisify(markdox.process)

/**
 * Generate WebdriverIO docs
 * @param {object} sidebars website/sidebars
 */
export async function generateWdioDocs (sidebars) {
    const COMMAND_DIR = path.join(__dirname, '..', '..', 'packages', 'webdriverio', 'src', 'commands')
    const COMMANDS = {
        browser: fs.readdirSync(path.join(COMMAND_DIR, 'browser')),
        element: fs.readdirSync(path.join(COMMAND_DIR, 'element')),
        mock: fs.readdirSync(path.join(COMMAND_DIR, 'mock'))
    }

    for (const [scope, files] of Object.entries(COMMANDS)) {
        /**
         * add scope to sidebar
         */
        sidebars.api.push({
            type: 'category',
            label: scope,
            items: []
        })

        for (const file of files) {
            const docDir = path.join(__dirname, '..', '..', 'website', 'docs', 'api', scope)
            if (!fs.existsSync(docDir)){
                fs.mkdirSync(docDir)
            }

            const filepath = path.join(COMMAND_DIR, scope, file)
            const output = path.join(docDir, `_${file.replace(/(js|ts)/, 'md')}`)
            const options = Object.assign({}, MARKDOX_OPTIONS, { output })
            await processDocs(filepath, options)
            console.log(`Generated docs for ${scope}/${file} - ${output}`)

            sidebars.api[sidebars.api.length - 1].items
                .push(`api/${scope}/${file.replace(/\.(js|ts)/, '')}`)
        }
    }
}
